'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import { FiShoppingCart } from 'react-icons/fi'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  compare_at_price?: number
  main_image_url?: string
  short_description?: string
  stock_quantity: number
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.main_image_url || '/images/placeholder.jpg',
      stock: product.stock_quantity,
    })
  }

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0

  const inStock = product.stock_quantity > 0

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden bg-gray-100">
        <Image
          src={product.main_image_url || '/images/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Badge réduction */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{discount}%
          </div>
        )}

        {/* Badge stock */}
        {!inStock && (
          <div className="absolute top-2 right-2 bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Rupture
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>
        
        {product.short_description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Prix */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-pink-600">
              {product.price.toFixed(2)}€
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-500 line-through">
                {product.compare_at_price.toFixed(2)}€
              </span>
            )}
          </div>
        </div>

        {/* Bouton Ajouter au panier */}
        {inStock ? (
          <button
            onClick={handleAddToCart}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <FiShoppingCart className="w-5 h-5" />
            <span>Ajouter au panier</span>
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed"
          >
            Indisponible
          </button>
        )}
      </div>
    </Link>
  )
}
