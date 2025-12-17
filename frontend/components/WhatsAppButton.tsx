'use client'

import { FaWhatsapp } from 'react-icons/fa'
import { getWhatsAppContactLink } from '@/lib/api'

export default function WhatsAppButton() {
  return (
    <a
      href={getWhatsAppContactLink()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition-all duration-300 transform hover:scale-110 animate-pulse-slow group"
      aria-label="Contactez-nous sur WhatsApp"
    >
      <FaWhatsapp className="w-8 h-8" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Besoin d'aide ? Contactez-nous !
      </span>
    </a>
  )
}
