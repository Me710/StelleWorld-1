'use client'

import { useState, useEffect } from 'react'
import { FiPackage, FiShoppingCart, FiDollarSign, FiTrendingUp, FiCalendar, FiRefreshCw, FiFileText, FiClock, FiArrowRight } from 'react-icons/fi'
import Link from 'next/link'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface OrderStats {
  total_orders: number
  pending_orders: number
  completed_orders: number
  cancelled_orders: number
  total_revenue: number
  revenue_today: number
  revenue_week: number
  revenue_month: number
  orders_today: number
  orders_week: number
  orders_month: number
  average_order_value: number
}

interface InvoiceStats {
  total_invoices: number
  paid_invoices: number
  pending_invoices: number
  total_invoiced: number
}

interface Stats {
  products: { total: number; active: number; featured: number; low_stock: number }
  orders: OrderStats
  invoices: InvoiceStats
  appointments: { total: number; upcoming: number; completed: number }
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    products: { total: 0, active: 0, featured: 0, low_stock: 0 },
    orders: {
      total_orders: 0, pending_orders: 0, completed_orders: 0, cancelled_orders: 0,
      total_revenue: 0, revenue_today: 0, revenue_week: 0, revenue_month: 0,
      orders_today: 0, orders_week: 0, orders_month: 0, average_order_value: 0
    },
    invoices: { total_invoices: 0, paid_invoices: 0, pending_invoices: 0, total_invoiced: 0 },
    appointments: { total: 0, upcoming: 0, completed: 0 }
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      let productsData = { total: 0, active: 0, featured: 0, low_stock: 0 }
      try {
        const productsRes = await axios.get(`${API_URL}/admin/products?limit=1000`)
        const products = productsRes.data.products || []
        productsData = {
          total: productsRes.data.total || products.length,
          active: products.filter((p: any) => p.is_active).length,
          featured: products.filter((p: any) => p.is_featured).length,
          low_stock: products.filter((p: any) => p.stock_quantity < 10).length
        }
      } catch { }

      let ordersData: OrderStats = {
        total_orders: 0, pending_orders: 0, completed_orders: 0, cancelled_orders: 0,
        total_revenue: 0, revenue_today: 0, revenue_week: 0, revenue_month: 0,
        orders_today: 0, orders_week: 0, orders_month: 0, average_order_value: 0
      }
      try {
        const ordersRes = await axios.get(`${API_URL}/orders/admin/all?limit=1000`)
        const orders = ordersRes.data.orders || []
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const ordersToday = orders.filter((o: any) => new Date(o.created_at) >= todayStart)
        const ordersWeek = orders.filter((o: any) => new Date(o.created_at) >= weekStart)
        const ordersMonth = orders.filter((o: any) => new Date(o.created_at) >= monthStart)

        const totalRevenue = orders.reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0)

        ordersData = {
          total_orders: orders.length,
          pending_orders: orders.filter((o: any) => o.status === 'pending').length,
          completed_orders: orders.filter((o: any) => o.status === 'delivered' || o.status === 'completed').length,
          cancelled_orders: orders.filter((o: any) => o.status === 'cancelled').length,
          total_revenue: totalRevenue,
          revenue_today: ordersToday.reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0),
          revenue_week: ordersWeek.reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0),
          revenue_month: ordersMonth.reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0),
          orders_today: ordersToday.length,
          orders_week: ordersWeek.length,
          orders_month: ordersMonth.length,
          average_order_value: orders.length > 0 ? totalRevenue / orders.length : 0
        }
      } catch { }

      let invoicesData = { total_invoices: 0, paid_invoices: 0, pending_invoices: 0, total_invoiced: 0 }
      try {
        const invoicesRes = await axios.get(`${API_URL}/invoices?limit=1000`)
        const invoices = invoicesRes.data.invoices || []
        invoicesData = {
          total_invoices: invoices.length,
          paid_invoices: invoices.filter((i: any) => i.is_paid || i.status === 'paid').length,
          pending_invoices: invoices.filter((i: any) => !i.is_paid && i.status !== 'paid').length,
          total_invoiced: invoices.reduce((acc: number, i: any) => acc + (i.total_amount || 0), 0)
        }
      } catch { }

      let appointmentsData = { total: 0, upcoming: 0, completed: 0 }
      try {
        const apptRes = await axios.get(`${API_URL}/appointments/admin/all?limit=1000`)
        const appointments = apptRes.data.appointments || []
        const now = new Date()
        appointmentsData = {
          total: appointments.length,
          upcoming: appointments.filter((a: any) => new Date(a.scheduled_at) > now && a.status !== 'cancelled').length,
          completed: appointments.filter((a: any) => a.status === 'completed').length
        }
      } catch { }

      setStats({
        products: productsData,
        orders: ordersData,
        invoices: invoicesData,
        appointments: appointmentsData
      })
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} $`

  return (
    <AdminPageWrapper>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Vue d'ensemble de votre boutique</p>
            </div>
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600"></div>
            </div>
          ) : (
            <>
              {/* Revenus principaux */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Revenus</h2>
                  <Link href="/admin/orders" className="text-pink-600 hover:text-pink-700 text-sm flex items-center">
                    Détails <FiArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.orders.total_revenue)}</p>
                    <p className="text-xs text-gray-400">{stats.orders.total_orders} commandes</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ce mois</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.orders.revenue_month)}</p>
                    <p className="text-xs text-gray-400">{stats.orders.orders_month} commandes</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cette semaine</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.orders.revenue_week)}</p>
                    <p className="text-xs text-gray-400">{stats.orders.orders_week} commandes</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Aujourd'hui</p>
                    <p className="text-xl font-bold text-pink-600">{formatCurrency(stats.orders.revenue_today)}</p>
                    <p className="text-xs text-gray-400">{stats.orders.orders_today} commandes</p>
                  </div>
                </div>
              </div>

              {/* Stats rapides */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <Link href="/admin/orders" className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:border-pink-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.orders.pending_orders}</p>
                      <p className="text-xs text-gray-500">En attente</p>
                    </div>
                    <FiClock className="w-5 h-5 text-pink-400" />
                  </div>
                </Link>

                <Link href="/admin/orders" className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:border-pink-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.orders.completed_orders}</p>
                      <p className="text-xs text-gray-500">Livrées</p>
                    </div>
                    <FiShoppingCart className="w-5 h-5 text-pink-400" />
                  </div>
                </Link>

                <Link href="/admin/products" className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:border-pink-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.products.total}</p>
                      <p className="text-xs text-gray-500">Produits</p>
                    </div>
                    <FiPackage className="w-5 h-5 text-pink-400" />
                  </div>
                </Link>

                <Link href="/admin/products" className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:border-pink-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.products.low_stock}</p>
                      <p className="text-xs text-gray-500">Stock bas</p>
                    </div>
                    <FiTrendingUp className="w-5 h-5 text-pink-400" />
                  </div>
                </Link>

                <Link href="/admin/invoices" className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:border-pink-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.invoices.total_invoices}</p>
                      <p className="text-xs text-gray-500">Factures</p>
                    </div>
                    <FiFileText className="w-5 h-5 text-pink-400" />
                  </div>
                </Link>

                <Link href="/admin/appointments" className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:border-pink-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.appointments.upcoming}</p>
                      <p className="text-xs text-gray-500">RDV à venir</p>
                    </div>
                    <FiCalendar className="w-5 h-5 text-pink-400" />
                  </div>
                </Link>
              </div>

              {/* Panneaux détaillés */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Commandes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Commandes</h3>
                    <FiShoppingCart className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-medium text-gray-900">{stats.orders.total_orders}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">En attente</span>
                      <span className="font-medium text-orange-600">{stats.orders.pending_orders}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Livrées</span>
                      <span className="font-medium text-green-600">{stats.orders.completed_orders}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Annulées</span>
                      <span className="font-medium text-gray-400">{stats.orders.cancelled_orders}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Panier moyen</span>
                        <span className="font-medium text-pink-600">{formatCurrency(stats.orders.average_order_value)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/admin/orders" className="block mt-4 text-center text-pink-600 hover:text-pink-700 text-xs font-medium">
                    Voir les commandes →
                  </Link>
                </div>

                {/* Factures */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Factures</h3>
                    <FiFileText className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-medium text-gray-900">{stats.invoices.total_invoices}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Payées</span>
                      <span className="font-medium text-green-600">{stats.invoices.paid_invoices}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">En attente</span>
                      <span className="font-medium text-orange-600">{stats.invoices.pending_invoices}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total facturé</span>
                        <span className="font-medium text-pink-600">{formatCurrency(stats.invoices.total_invoiced)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/admin/invoices" className="block mt-4 text-center text-pink-600 hover:text-pink-700 text-xs font-medium">
                    Voir les factures →
                  </Link>
                </div>

                {/* Inventaire */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Inventaire</h3>
                    <FiPackage className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total produits</span>
                      <span className="font-medium text-gray-900">{stats.products.total}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Actifs</span>
                      <span className="font-medium text-green-600">{stats.products.active}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">En vedette</span>
                      <span className="font-medium text-gray-900">{stats.products.featured}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Stock faible</span>
                      <span className={`font-medium ${stats.products.low_stock > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {stats.products.low_stock}
                      </span>
                    </div>
                  </div>
                  <Link href="/admin/products" className="block mt-4 text-center text-pink-600 hover:text-pink-700 text-xs font-medium">
                    Gérer les produits →
                  </Link>
                </div>
              </div>

              {/* Actions Rapides */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Actions rapides</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link href="/admin/products" className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                    <FiPackage className="w-5 h-5 text-pink-500" />
                    <span className="text-sm text-gray-700">Ajouter produit</span>
                  </Link>
                  <Link href="/admin/orders" className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                    <FiShoppingCart className="w-5 h-5 text-pink-500" />
                    <span className="text-sm text-gray-700">Voir commandes</span>
                  </Link>
                  <Link href="/admin/appointments" className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                    <FiCalendar className="w-5 h-5 text-pink-500" />
                    <span className="text-sm text-gray-700">Rendez-vous</span>
                  </Link>
                  <Link href="/admin/settings" className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                    <FiDollarSign className="w-5 h-5 text-pink-500" />
                    <span className="text-sm text-gray-700">Paramètres</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  )
}
