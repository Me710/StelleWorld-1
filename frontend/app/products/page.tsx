'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'
import { getProducts } from '@/lib/api'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadProducts()
  }, [filter])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts({ filter, search })
      setProducts(data.products || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tous nos produits</h1>
          <p className="text-xl text-gray-600">Découvrez notre collection complète</p>
        </div>

        {/* Filtres */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">Tous les produits</option>
            <option value="new">Nouveautés</option>
            <option value="promo">En promotion</option>
            <option value="bestsellers">Meilleures ventes</option>
          </select>
        </div>

        {/* Grille de produits */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}
