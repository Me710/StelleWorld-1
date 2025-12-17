'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import { getFeaturedProducts } from '@/lib/api'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  compare_at_price?: number
  main_image_url?: string
  short_description?: string
  stock_quantity: number
  is_featured: boolean
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getFeaturedProducts()
        if (data.featured_products && data.featured_products.length > 0) {
          // Convertir le format API vers le format attendu par ProductCard
          const formattedProducts = data.featured_products.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            compare_at_price: p.compare_at_price,
            main_image_url: p.main_image_url,
            short_description: p.short_description,
            stock_quantity: p.is_in_stock ? 10 : 0,
            is_featured: true
          }))
          setProducts(formattedProducts)
        } else {
          setProducts(demoProducts)
        }
      } catch (error) {
        console.error('Erreur chargement produits:', error)
        // Utiliser des produits de démonstration
        setProducts(demoProducts)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Produits en Vedette</h2>
          <p className="text-xl text-gray-600">
            Découvrez notre sélection de produits populaires
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/products"
            className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Voir tous les produits
          </a>
        </div>
      </div>
    </section>
  )
}

// Produits de démonstration
const demoProducts: Product[] = [
  {
    id: 1,
    name: 'Mèches Brésiliennes Premium',
    slug: 'meches-bresiliennes-premium',
    price: 149.99,
    compare_at_price: 199.99,
    main_image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop',
    short_description: 'Mèches 100% naturelles, qualité premium',
    stock_quantity: 15,
    is_featured: true,
  },
  {
    id: 2,
    name: 'Sérum Vitamine C',
    slug: 'serum-vitamine-c',
    price: 45.99,
    main_image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
    short_description: 'Sérum éclat intense pour une peau lumineuse',
    stock_quantity: 30,
    is_featured: true,
  },
  {
    id: 3,
    name: 'Mèches Indiennes Ondulantes',
    slug: 'meches-indiennes-ondulantes',
    price: 129.99,
    compare_at_price: 159.99,
    main_image_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop',
    short_description: 'Ondulations naturelles et durables',
    stock_quantity: 8,
    is_featured: true,
  },
  {
    id: 4,
    name: 'Crème Hydratante Luxe',
    slug: 'creme-hydratante-luxe',
    price: 59.99,
    main_image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    short_description: 'Hydratation intense 24h',
    stock_quantity: 25,
    is_featured: true,
  },
]
