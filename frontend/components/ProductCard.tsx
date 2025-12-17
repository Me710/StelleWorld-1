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
    e.stopPropagation()
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
    <div className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <Link href={`/products/${product.slug}`}>
        {/* Image - Plus grande  */}
        <div className="relative h-80 overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            src={product.main_image_url || '/images/placeholder.jpg'}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{discount}%
            </div>
          )}

          {!inStock && (
            <div className="absolute top-2 right-2 bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Rupture
            </div>
          )}
        </div>
      </Link>

      {/* Contenu */}
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors h-12">
            {product.name}
          </h3>
        </Link>
        
        {product.short_description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10">
            {product.short_description}
          </p>
        )}

        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xl font-bold text-pink-600">
            {product.price.toFixed(2)} $
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-500 line-through">
              {product.compare_at_price.toFixed(2)} $
            </span>
          )}
        </div>

        <div className="flex-grow"></div>

        {inStock ? (
          <button
            onClick={handleAddToCart}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 mt-auto"
          >
            <FiShoppingCart className="w-5 h-5" />
            <span>Ajouter au panier</span>
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed mt-auto"
          >
            Indisponible
          </button>
        )}
      </div>
    </div>
  )
}
