'use client'

import { useState, useEffect } from 'react'
import { FiEye, FiPackage } from 'react-icons/fi'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

const statusColors: any = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'confirmed': 'bg-blue-100 text-blue-800',
  'processing': 'bg-purple-100 text-purple-800',
  'shipped': 'bg-indigo-100 text-indigo-800',
  'delivered': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
}

const statusLabels: any = {
  'pending': 'En attente',
  'confirmed': 'Confirmée',
  'processing': 'En préparation',
  'shipped': 'Expédiée',
  'delivered': 'Livrée',
  'cancelled': 'Annulée',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [filter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      // En mode démo, utiliser des commandes fictives
      const demoOrders = generateDemoOrders()
      setOrders(demoOrders)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateDemoOrders = () => {
    return [
      {
        id: 1,
        order_number: 'ST-20251217-A1B2',
        user_name: 'Marie Dupont',
        user_email: 'marie.dupont@example.com',
        status: 'confirmed',
        payment_status: 'paid',
        total_amount: 329.98,
        total_items: 2,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        shipping_city: 'Montréal'
      },
      {
        id: 2,
        order_number: 'ST-20251216-C3D4',
        user_name: 'Sophie Martin',
        user_email: 'sophie.martin@example.com',
        status: 'shipped',
        payment_status: 'paid',
        total_amount: 189.99,
        total_items: 3,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        shipping_city: 'Laval'
      },
      {
        id: 3,
        order_number: 'ST-20251215-E5F6',
        user_name: 'Julie Bernard',
        user_email: 'julie.bernard@example.com',
        status: 'delivered',
        payment_status: 'paid',
        total_amount: 249.97,
        total_items: 4,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        shipping_city: 'Québec'
      },
      {
        id: 4,
        order_number: 'ST-20251217-G7H8',
        user_name: 'Émilie Rousseau',
        user_email: 'emilie.rousseau@example.com',
        status: 'pending',
        payment_status: 'pending',
        total_amount: 159.99,
        total_items: 1,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        shipping_city: 'Montréal'
      },
    ]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        {/* Header */}
        <div className=\"mb-8\">
          <h1 className=\"text-3xl font-bold text-gray-900\">Gestion des Commandes</h1>
          <p className=\"text-gray-600 mt-2\">Gérez les commandes WhatsApp de vos clients</p>
        </div>

        {/* Filtres */}
        <div className=\"bg-white rounded-lg shadow-md p-4 mb-6\">
          <div className=\"flex space-x-2 overflow-x-auto\">
            {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filter === status
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Toutes' : statusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Table des commandes */}
        <div className=\"bg-white rounded-lg shadow-md overflow-hidden\">
          <div className=\"overflow-x-auto\">
            <table className=\"min-w-full divide-y divide-gray-200\">
              <thead className=\"bg-gray-50\">
                <tr>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Numéro
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Client
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Statut
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Total
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Articles
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Date
                  </th>
                  <th className=\"px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className=\"bg-white divide-y divide-gray-200\">
                {orders.map((order: any) => (
                  <tr key={order.id} className=\"hover:bg-gray-50\">
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div className=\"font-semibold text-gray-900\">{order.order_number}</div>
                      <div className=\"text-sm text-gray-600\">{order.shipping_city}</div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div className=\"font-medium text-gray-900\">{order.user_name}</div>
                      <div className=\"text-sm text-gray-600\">{order.user_email}</div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div className=\"font-semibold text-gray-900\">{order.total_amount.toFixed(2)}€</div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-gray-900\">
                      {order.total_items} article{order.total_items > 1 ? 's' : ''}
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-600\">
                      {formatDate(order.created_at)}
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-right\">
                      <button className=\"text-pink-600 hover:text-pink-900\">
                        <FiEye className=\"inline w-5 h-5\" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {orders.length === 0 && !loading && (
          <div className=\"bg-white rounded-lg shadow-md p-12 text-center\">
            <FiPackage className=\"w-16 h-16 text-gray-400 mx-auto mb-4\" />
            <h3 className=\"text-xl font-bold text-gray-900 mb-2\">Aucune commande</h3>
            <p className=\"text-gray-600\">Les commandes WhatsApp apparaîtront ici</p>
          </div>
        )}
      </div>
    </div>
  )
}
