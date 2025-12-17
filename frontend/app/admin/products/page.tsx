'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiEdit, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [category])

  const loadCategories = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products/categories`)
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params: any = { limit: 100 }
      if (category !== 'all') {
        const cat = categories.find((c: any) => c.slug === category)
        if (cat) params.category_id = cat.id
      }
      if (search) params.search = search
      
      const { data } = await axios.get(`${API_URL}/api/products`, { params })
      setProducts(data.products || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return
    
    try {
      await axios.delete(`${API_URL}/api/products/${productId}`)
      loadProducts()
      alert('Produit supprimé avec succès')
    } catch (error) {
      alert('Erreur lors de la suppression')
    }
  }

  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        {/* Header */}
        <div className=\"flex justify-between items-center mb-8\">
          <div>
            <h1 className=\"text-3xl font-bold text-gray-900\">Gestion des Produits</h1>
            <p className=\"text-gray-600 mt-2\">Gérez votre catalogue de produits</p>
          </div>
          <Link
            href=\"/admin/products/create\"
            className=\"bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors\"
          >
            <FiPlus className=\"w-5 h-5\" />
            <span>Nouveau Produit</span>
          </Link>
        </div>

        {/* Filtres */}
        <div className=\"bg-white rounded-lg shadow-md p-6 mb-6\">
          <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
            <div className=\"md:col-span-2\">
              <div className=\"relative\">
                <FiSearch className=\"absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5\" />
                <input
                  type=\"text\"
                  placeholder=\"Rechercher un produit...\"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
                  className=\"w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500\"
                />
              </div>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className=\"px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500\"
            >
              <option value=\"all\">Toutes les catégories</option>
              {categories.map((cat: any) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table des produits */}
        <div className=\"bg-white rounded-lg shadow-md overflow-hidden\">
          {loading ? (
            <div className=\"p-12 text-center\">
              <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto\"></div>
              <p className=\"text-gray-600 mt-4\">Chargement...</p>
            </div>
          ) : (
            <div className=\"overflow-x-auto\">
              <table className=\"min-w-full divide-y divide-gray-200\">
                <thead className=\"bg-gray-50\">
                  <tr>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Produit
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Catégorie
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Prix
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Stock
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Ventes
                    </th>
                    <th className=\"px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className=\"bg-white divide-y divide-gray-200\">
                  {products.map((product: any) => (
                    <tr key={product.id} className=\"hover:bg-gray-50\">
                      <td className=\"px-6 py-4 whitespace-nowrap\">
                        <div className=\"flex items-center\">
                          <div className=\"relative h-12 w-12 flex-shrink-0 mr-4\">
                            <Image
                              src={product.main_image_url || '/images/placeholder.jpg'}
                              alt={product.name}
                              fill
                              className=\"object-cover rounded-lg\"
                            />
                          </div>
                          <div>
                            <div className=\"font-semibold text-gray-900\">{product.name}</div>
                            <div className=\"text-sm text-gray-600\">{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap\">
                        <span className=\"px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800\">
                          {product.category?.name || 'N/A'}
                        </span>
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap\">
                        <div className=\"font-semibold text-gray-900\">{product.price.toFixed(2)}€</div>
                        {product.compare_at_price && (
                          <div className=\"text-sm text-gray-500 line-through\">
                            {product.compare_at_price.toFixed(2)}€
                          </div>
                        )}
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap\">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock_quantity > 10 
                            ? 'bg-green-100 text-green-800'
                            : product.stock_quantity > 0
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock_quantity} unités
                        </span>
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-gray-900\">
                        {product.sales_count || 0} ventes
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-right text-sm font-medium\">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className=\"text-blue-600 hover:text-blue-900 mr-4\"
                        >
                          <FiEdit className=\"inline w-5 h-5\" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className=\"text-red-600 hover:text-red-900\"
                        >
                          <FiTrash2 className=\"inline w-5 h-5\" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
