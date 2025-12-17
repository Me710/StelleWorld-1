'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

export default function PromoBanner() {
  const [banner, setBanner] = useState<any>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    loadBanner()
  }, [])

  const loadBanner = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/settings/promo_banner`)
      if (data.value) {
        setBanner(JSON.parse(data.value))
      }
    } catch (error) {
      // Utiliser bannière par défaut
      setBanner({
        message: '🎉 PROMOTION : -30% sur une sélection de produits avec le code PROMO30',
        backgroundColor: '#ec4899',
        textColor: '#ffffff'
      })
    }
  }

  if (!visible || !banner) return null

  return (
    <div
      className="w-full py-3 px-4 text-center font-semibold text-sm relative"
      style={{
        backgroundColor: banner.backgroundColor || '#ec4899',
        color: banner.textColor || '#ffffff'
      }}
    >
      <p>{banner.message}</p>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70"
      >
        ✕
      </button>
    </div>
  )
}
