'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FiSearch } from 'react-icons/fi'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products`, { params: { limit: 100 } })
      setProducts(data.products || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestion des Produits</h1>
        <p className="text-gray-600 mb-6">Total: {products.length} produits</p>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ventes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative h-12 w-12 mr-4">
                          <Image
                            src={product.main_image_url || '/images/placeholder.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="font-semibold">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{product.price.toFixed(2)}€</td>
                    <td className="px-6 py-4">{product.stock_quantity} unités</td>
                    <td className="px-6 py-4">{product.sales_count || 0} ventes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
