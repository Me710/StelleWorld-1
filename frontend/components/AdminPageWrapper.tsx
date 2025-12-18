'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FiHome, FiPackage, FiShoppingCart, FiFileText, FiLogOut, FiGrid, FiScissors, FiCalendar, FiSettings, FiUser } from 'react-icons/fi'
import { ReactNode } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface AdminPageWrapperProps {
  children: ReactNode
}

interface User {
  id: number
  email: string
  full_name: string
  is_admin: boolean
}

export default function AdminPageWrapper({ children }: AdminPageWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: FiHome },
    { name: 'Produits', href: '/admin/products', icon: FiPackage },
    { name: 'Catégories', href: '/admin/categories', icon: FiGrid },
    { name: 'Commandes', href: '/admin/orders', icon: FiShoppingCart },
    { name: 'Services', href: '/admin/services', icon: FiScissors },
    { name: 'Rendez-vous', href: '/admin/appointments', icon: FiCalendar },
    { name: 'Factures', href: '/admin/invoices', icon: FiFileText },
    { name: 'Paramètres', href: '/admin/settings', icon: FiSettings },
  ]

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    try {
      const { data } = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.is_admin) {
        setUser(data)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      }
    } catch {
      localStorage.removeItem('admin_token')
      router.push('/admin/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    delete axios.defaults.headers.common['Authorization']
    router.push('/admin/login')
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                StelleWorld
              </Link>
              <span className="text-sm text-gray-500">Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiUser className="w-4 h-4" />
                  <span className="text-sm">{user.full_name || user.email}</span>
                </div>
              )}
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Voir le site
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 flex items-center space-x-2"
              >
                <FiLogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white min-h-screen shadow-sm">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                  ? 'bg-pink-50 text-pink-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
