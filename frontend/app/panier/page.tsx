'use client'

import { useCartStore } from '@/lib/store'
import { getWhatsAppCartLink } from '@/lib/api'
import Image from 'next/image'
import Link from 'next/link'
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

export default function CartPage() {
  const cart = useCartStore((state) => state.cart)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice())

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre panier est vide</h2>
          <p className="text-gray-600 mb-8">Découvrez nos produits et ajoutez-les à votre panier</p>
          <Link
            href="/products"
            className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Voir les produits
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Panier</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des produits */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* Infos produit */}
                  <div className="flex-grow">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-pink-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-pink-600 font-bold mt-1">{item.price.toFixed(2)}€</p>
                    {item.stock <= 5 && (
                      <p className="text-sm text-orange-600 mt-1">
                        Seulement {item.stock} en stock
                      </p>
                    )}
                  </div>

                  {/* Quantité */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      disabled={item.quantity >= item.stock}
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Total item */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {(item.price * item.quantity).toFixed(2)}€
                    </p>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Résumé */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Résumé de la commande</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{getTotalPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span className="text-green-600 font-semibold">Gratuite</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{getTotalPrice.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {/* Bouton WhatsApp */}
              <a
                href={getWhatsAppCartLink(cart)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-bold text-center flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <FaWhatsapp className="w-6 h-6" />
                <span>Commander via WhatsApp</span>
              </a>

              <p className="text-sm text-gray-600 text-center mt-4">
                Cliquez pour envoyer votre commande via WhatsApp. Nous vous répondrons rapidement !
              </p>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📦 Livraison gratuite</h3>
                <p className="text-sm text-gray-600">
                  Profitez de la livraison gratuite sur toutes les commandes en Grande Région de Montréal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
