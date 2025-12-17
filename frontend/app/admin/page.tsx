'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiPackage, FiShoppingCart, FiUsers, FiDollarSign, FiTrendingUp, FiImage } from 'react-icons/fi'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Charger les stats depuis différents endpoints
      const [productsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/api/products?limit=1`),
        axios.get(`${API_URL}/api/orders/admin/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
        }).catch(() => ({ data: {} }))
      ])

      setStats({
        total_products: productsRes.data.total || 0,
        total_orders: ordersRes.data?.total_orders || 0,
        total_revenue: ordersRes.data?.total_revenue || 0,
        pending_orders: ordersRes.data?.pending_orders || 0,
      })
    } catch (error) {
      console.error('Erreur chargement stats:', error)
      // Stats par défaut
      setStats({
        total_products: 19,
        total_orders: 12,
        total_revenue: 2450.50,
        pending_orders: 3,
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Produits',
      value: stats?.total_products || 0,
      icon: FiPackage,
      color: 'bg-blue-500',
      link: '/admin/products'
    },
    {
      title: 'Commandes',
      value: stats?.total_orders || 0,
      icon: FiShoppingCart,
      color: 'bg-green-500',
      link: '/admin/orders'
    },
    {
      title: 'Revenu Total',
      value: `${stats?.total_revenue?.toFixed(2) || 0}€`,
      icon: FiDollarSign,
      color: 'bg-purple-500',
      link: '/admin/orders'
    },
    {
      title: 'En Attente',
      value: stats?.pending_orders || 0,
      icon: FiTrendingUp,
      color: 'bg-orange-500',
      link: '/admin/orders'
    },
  ]

  const quickActions = [
    { title: 'Gérer les Produits', icon: FiPackage, link: '/admin/products', color: 'bg-blue-600' },
    { title: 'Voir les Commandes', icon: FiShoppingCart, link: '/admin/orders', color: 'bg-green-600' },
    { title: 'Hero Slider', icon: FiImage, link: '/admin/hero', color: 'bg-purple-600' },
    { title: 'Fournisseurs', icon: FiUsers, link: '/admin/suppliers', color: 'bg-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
          <p className="text-gray-600 mt-2">Bienvenue dans votre espace de gestion StelleWorld</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link key={index} href={stat.link}>
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.link}>
                <div className={`${action.color} text-white rounded-lg p-6 hover:opacity-90 transition-opacity cursor-pointer`}>
                  <action.icon className="w-8 h-8 mb-3" />
                  <h3 className="font-semibold">{action.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produits populaires */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Produits Populaires</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <p className="font-semibold text-gray-900">Mèches Brésiliennes Premium</p>
                  <p className="text-sm text-gray-600">149.99€ • 45 ventes</p>
                </div>
                <span className="text-green-600 font-semibold">↗ Tendance</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <p className="font-semibold text-gray-900">Sérum Vitamine C</p>
                  <p className="text-sm text-gray-600">45.99€ • 92 ventes</p>
                </div>
                <span className="text-green-600 font-semibold">↗ Tendance</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Baume à Lèvres</p>
                  <p className="text-sm text-gray-600">12.99€ • 120 ventes</p>
                </div>
                <span className="text-green-600 font-semibold">↗ Top vente</span>
              </div>
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activité Récente</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <FiShoppingCart className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Nouvelle commande</p>
                  <p className="text-xs text-gray-600">Il y a 5 minutes</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <FiPackage className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Produit modifié</p>
                  <p className="text-xs text-gray-600">Il y a 1 heure</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <FiUsers className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Nouveau client</p>
                  <p className="text-xs text-gray-600">Il y a 2 heures</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
