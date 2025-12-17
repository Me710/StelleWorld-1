'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

export default function AdminHeroPage() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSlides()
  }, [])

  const loadSlides = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/hero-slides`)
      setSlides(data.slides || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestion Hero Slider</h1>
        <p className="text-gray-600 mb-6">Total: {slides.length} slides</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slides.map((slide: any) => (
            <div key={slide.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={slide.image_url}
                  alt={slide.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 bg-gray-900 text-white px-2 py-1 rounded text-xs">
                  Ordre: {slide.sort_order}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2">{slide.title}</h3>
                {slide.subtitle && <p className="text-sm text-gray-600">{slide.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
