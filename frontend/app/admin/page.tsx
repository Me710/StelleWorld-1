'use client'

import { useState, useEffect } from 'react'
import { FiPackage, FiShoppingCart, FiDollarSign, FiTrendingUp } from 'react-icons/fi'
import Link from 'next/link'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products/`)
      setStats({
        total_products: data.total || 0,
        total_orders: 12,
        total_revenue: 2450.50,
        pending_orders: 3,
      })
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const statCards = [
    { title: 'Total Produits', value: stats.total_products, icon: FiPackage, color: 'bg-blue-500', link: '/admin/products' },
    { title: 'Commandes', value: stats.total_orders, icon: FiShoppingCart, color: 'bg-green-500', link: '/admin/orders' },
    { title: 'Revenu Total', value: `${stats.total_revenue.toFixed(2)} $ CAD`, icon: FiDollarSign, color: 'bg-purple-500', link: '/admin/orders' },
    { title: 'En Attente', value: stats.pending_orders, icon: FiTrendingUp, color: 'bg-orange-500', link: '/admin/orders' },
  ]

  return (
    <AdminPageWrapper>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Administrateur</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, i) => (
              <Link key={i} href={stat.link}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
        </div>
      </div>
    </AdminPageWrapper>
  )
}
