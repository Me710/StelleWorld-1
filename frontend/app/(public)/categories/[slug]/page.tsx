'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import { getProducts, getCategory } from '@/lib/api'

const categoryInfo: any = {
  'meches': {
    name: 'Mèches',
    description: 'Découvrez notre collection de mèches premium pour tous les styles',
    banner: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1920&h=400&fit=crop',
  },
  'skin-care': {
    name: 'Skin Care',
    description: 'Produits de soins professionnels pour une peau éclatante',
    banner: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1920&h=400&fit=crop',
  },
  'rendez-vous': {
    name: 'Rendez-vous',
    description: 'Réservez votre consultation avec nos experts beauté',
    banner: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&h=400&fit=crop',
  },
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const category = categoryInfo[slug] || { name: slug, description: '', banner: '' }

  useEffect(() => {
    loadProducts()
  }, [slug])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts({ category: slug })
      setProducts(data.products || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${category.banner})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {category.name}
            </h1>
            <p className="text-xl text-gray-200">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {slug === 'rendez-vous' ? (
          /* Section Rendez-vous spéciale */
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Réservez votre consultation
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Nos experts beauté sont à votre disposition pour vous conseiller et réaliser vos prestations dans les meilleures conditions.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="p-6 bg-pink-50 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">Pose de mèches</h3>
                  <p className="text-gray-600 text-sm">Installation professionnelle</p>
                </div>
                <div className="p-6 bg-purple-50 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">Soins du visage</h3>
                  <p className="text-gray-600 text-sm">Traitements personnalisés</p>
                </div>
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">Consultation beauté</h3>
                  <p className="text-gray-600 text-sm">Conseils d'experts</p>
                </div>
              </div>

              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '')}?text=Bonjour, je souhaite prendre rendez-vous`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 bg-green-500 hover:bg-green-600 text-white px-10 py-5 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>Prendre rendez-vous maintenant</span>
              </a>

              <p className="text-sm text-gray-600 mt-6">
                Réponse rapide garantie • Disponible 7j/7
              </p>
            </div>
          </div>
        ) : loading ? (
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
            <p className="text-xl text-gray-600">Aucun produit disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}
