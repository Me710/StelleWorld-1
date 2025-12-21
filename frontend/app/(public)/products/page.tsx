'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'
import { getProducts, getCategories } from '@/lib/api'
import { FiFilter, FiX } from 'react-icons/fi'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [onPromoOnly, setOnPromoOnly] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, search, inStockOnly, onPromoOnly])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params: any = { limit: 100 }
      if (selectedCategory) params.category_id = selectedCategory
      if (search) params.search = search
      if (inStockOnly) params.in_stock_only = true
      if (onPromoOnly) params.on_promo = true
      
      const data = await getProducts(params)
      setProducts(data.products || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-gray-900 mb-4">Catégories</h3>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === null
                ? 'bg-pink-100 text-pink-700 font-semibold'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            Tous les produits
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-pink-100 text-pink-700 font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {cat.name} ({cat.product_count})
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 mb-4">Disponibilité</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span className="text-gray-700">En stock uniquement</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              checked={onPromoOnly}
              onChange={(e) => setOnPromoOnly(e.target.checked)}
            />
            <span className="text-gray-700">En promotion</span>
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tous nos produits</h1>
          <p className="text-xl text-gray-600">{products.length} produits disponibles</p>
        </div>

        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden flex items-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-md mb-6 w-full justify-center"
        >
          <FiFilter className="w-5 h-5" />
          <span>Filtres</span>
        </button>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {showMobileFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
              <div className="bg-white w-80 h-full overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Filtres</h2>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-[500px] bg-gray-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-xl text-gray-600">Aucun produit trouvé</p>
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSearch('')
                  }}
                  className="mt-4 text-pink-600 hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
