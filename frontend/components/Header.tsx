'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import { FiShoppingCart, FiMenu, FiX } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

interface Category {
  id: number
  name: string
  slug: string
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const totalItems = useCartStore(state => state.getTotalItems())

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
      // Fallback
      setCategories([
        { id: 1, name: 'Mèches', slug: 'meches' },
        { id: 2, name: 'Skin Care', slug: 'skin-care' },
      ])
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              StelleWorld
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-pink-600 font-medium transition-colors">
              Tous les produits
            </Link>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/rendez-vous" className="text-gray-700 hover:text-pink-600 font-medium transition-colors">
              Rendez-vous
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* WhatsApp Contact */}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '')}?text=Bonjour`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span className="text-sm font-medium">Contact</span>
            </a>

            {/* Cart */}
            <Link href="/panier" className="relative">
              <FiShoppingCart className="w-6 h-6 text-gray-700 hover:text-pink-600 transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/products"
              className="block text-gray-700 hover:text-pink-600 font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tous les produits
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="block text-gray-700 hover:text-pink-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/rendez-vous"
              className="block text-gray-700 hover:text-pink-600 font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rendez-vous
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '')}?text=Bonjour`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 py-2"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span>Contacter via WhatsApp</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
