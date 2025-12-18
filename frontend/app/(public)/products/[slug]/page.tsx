'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import { getProductBySlug } from '@/lib/api'
import { FiShoppingCart, FiMinus, FiPlus, FiChevronLeft, FiShare2, FiHeart } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import ProductCard from '@/components/ProductCard'

interface Product {
  id: number
  name: string
  slug: string
  description?: string
  short_description?: string
  price: number
  compare_at_price?: number
  discount_percentage?: number
  main_image_url?: string
  gallery_images?: string
  stock_quantity?: number
  track_inventory: boolean
  is_in_stock: boolean
  is_featured: boolean
  product_type: string
  category?: {
    id: number
    name: string
    slug: string
  }
  related_products?: any[]
  sales_count: number
  view_count: number
  meta_title?: string
  meta_description?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [isAddedToCart, setIsAddedToCart] = useState(false)

  const addToCart = useCartStore((state) => state.addToCart)

  useEffect(() => {
    if (slug) {
      loadProduct()
    }
  }, [slug])

  const loadProduct = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProductBySlug(slug)
      setProduct(data)
      setSelectedImage(data.main_image_url || '/images/placeholder.jpg')
    } catch (err) {
      console.error('Erreur:', err)
      setError('Produit non trouvé')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.main_image_url || '/images/placeholder.jpg',
      stock: product.stock_quantity || 999,
      quantity: quantity,
    })

    setIsAddedToCart(true)
    setTimeout(() => setIsAddedToCart(false), 2000)
  }

  const handleWhatsAppInquiry = () => {
    if (!product) return
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '') || ''
    const message = `Bonjour ! Je suis intéressé(e) par le produit "${product.name}" à ${product.price.toFixed(2)} $ CAD. Pouvez-vous me donner plus d'informations ?`
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description || '',
          url: window.location.href,
        })
      } catch (err) {
        console.log('Partage annulé')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papiers !')
    }
  }

  // Parse gallery images avec gestion d'erreur
  const galleryImages: string[] = (() => {
    if (!product?.gallery_images) return []
    try {
      const parsed = JSON.parse(product.gallery_images)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()
  const allImages = product?.main_image_url
    ? [product.main_image_url, ...galleryImages]
    : galleryImages

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="h-[500px] bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Produit non trouvé</h1>
            <p className="text-gray-600 mb-8">Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
            <Link
              href="/products"
              className="inline-flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              <FiChevronLeft className="w-5 h-5" />
              <span>Voir tous les produits</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0

  const maxQuantity = product.track_inventory ? (product.stock_quantity || 0) : 99

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-pink-600 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-pink-600 transition-colors">Produits</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/categories/${product.category.slug}`}
                className="hover:text-pink-600 transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Image principale */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={selectedImage || '/images/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  -{discount}%
                </div>
              )}
              {!product.is_in_stock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold text-lg">
                    Rupture de stock
                  </span>
                </div>
              )}
            </div>

            {/* Galerie miniatures */}
            {allImages.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${selectedImage === img
                      ? 'border-pink-500 ring-2 ring-pink-200'
                      : 'border-gray-200 hover:border-pink-300'
                      }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informations produit */}
          <div className="space-y-6">
            {/* Catégorie */}
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="inline-block text-pink-600 hover:text-pink-700 text-sm font-medium uppercase tracking-wide"
              >
                {product.category.name}
              </Link>
            )}

            {/* Nom */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Prix */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-pink-600">
                {product.price.toFixed(2)} $ CAD
              </span>
              {product.compare_at_price && (
                <span className="text-xl text-gray-500 line-through">
                  {product.compare_at_price.toFixed(2)} $
                </span>
              )}
              {discount > 0 && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                  Économisez {(product.compare_at_price! - product.price).toFixed(2)} $
                </span>
              )}
            </div>

            {/* Description courte */}
            {product.short_description && (
              <p className="text-gray-600 text-lg leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* Stock status */}
            <div className="flex items-center space-x-2">
              {product.is_in_stock ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">
                    {product.track_inventory && product.stock_quantity
                      ? `En stock (${product.stock_quantity} disponibles)`
                      : 'En stock'
                    }
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">Rupture de stock</span>
                </>
              )}
            </div>

            {/* Quantité et Ajout panier */}
            {product.is_in_stock && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 font-medium">Quantité:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="px-6 py-2 text-lg font-semibold min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= maxQuantity}
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-3 transition-all duration-300 ${isAddedToCart
                      ? 'bg-green-500 text-white'
                      : 'bg-pink-600 hover:bg-pink-700 text-white'
                      }`}
                  >
                    <FiShoppingCart className="w-6 h-6" />
                    <span>{isAddedToCart ? 'Ajouté au panier !' : 'Ajouter au panier'}</span>
                  </button>

                  <button
                    onClick={handleWhatsAppInquiry}
                    className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg font-bold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <FaWhatsapp className="w-6 h-6" />
                    <span>Demander info</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions secondaires */}
            <div className="flex items-center space-x-4 pt-4 border-t">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
              >
                <FiShare2 className="w-5 h-5" />
                <span>Partager</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors">
                <FiHeart className="w-5 h-5" />
                <span>Favoris</span>
              </button>
            </div>

            {/* Description complète */}
            {product.description && (
              <div className="pt-6 border-t">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <div
                  className="prose prose-pink max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Statistiques */}
            <div className="flex items-center space-x-6 text-sm text-gray-500 pt-4">
              <span>{product.view_count} vues</span>
              <span>{product.sales_count} vendus</span>
            </div>
          </div>
        </div>

        {/* Produits recommandés */}
        {product.related_products && product.related_products.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Produits similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.related_products.map((related: any) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        )}

        {/* Retour aux produits */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-semibold transition-colors"
          >
            <FiChevronLeft className="w-5 h-5" />
            <span>Voir tous les produits</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
