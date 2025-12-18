'use client'

import Link from 'next/link'
import { FaWhatsapp, FaFacebook } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent mb-4">
              StelleWorld
            </h3>
            <p className="text-gray-400 text-sm">
              Votre destination beauté pour les mèches, soins de la peau et services professionnels.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <FaWhatsapp className="w-6 h-6" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61583818906007"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <FaFacebook className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">Tous les produits</Link></li>
              <li><Link href="/categories/meches" className="hover:text-white transition-colors">Mèches</Link></li>
              <li><Link href="/categories/skin-care" className="hover:text-white transition-colors">Skin Care</Link></li>
              <li><Link href="/categories/rendez-vous" className="hover:text-white transition-colors">Rendez-vous</Link></li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="font-semibold mb-4">Informations</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/politique-retour" className="hover:text-white transition-colors">Politique de retour</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center space-x-2"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span>Contactez-nous sur WhatsApp</span>
                </a>
              </li>
              <li>Montréal, QC, Canada</li>
              <li>Ouvert 7j/7</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} StelleWorld. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
