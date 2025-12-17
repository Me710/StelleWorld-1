'use client'

import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'
import { getHeroSlides } from '@/lib/api'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

interface HeroSlide {
  id: number
  title: string
  subtitle?: string
  image_url: string
  cta_text?: string
  cta_link?: string
}

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const data = await getHeroSlides()
        setSlides(data.slides || defaultSlides)
      } catch (error) {
        console.error('Erreur chargement slides:', error)
        // Fallback vers slides par défaut
        setSlides(defaultSlides)
      } finally {
        setLoading(false)
      }
    }

    loadSlides()
  }, [])

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-200 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  return (
    <section className="relative w-full h-[600px] overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-white',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-pink-500',
        }}
        navigation
        loop
        className="h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full">
              {/* Image de fond */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image_url})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
              </div>

              {/* Contenu */}
              <div className="relative z-10 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-2xl text-white">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
                      {slide.title}
                    </h1>
                    {slide.subtitle && (
                      <p className="text-xl md:text-2xl mb-8 text-gray-200 animate-slide-up">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.cta_text && slide.cta_link && (
                      <a
                        href={slide.cta_link}
                        className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
                      >
                        {slide.cta_text}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

// Slides par défaut en cas d'erreur API
const defaultSlides: HeroSlide[] = [
  {
    id: 1,
    title: 'Découvrez notre collection de mèches',
    subtitle: 'Qualité premium pour sublimer votre beauté',
    image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1920&h=800&fit=crop',
    cta_text: 'Découvrir',
    cta_link: '/categories/meches',
  },
  {
    id: 2,
    title: 'Soins de la peau professionnels',
    subtitle: 'Des produits sélectionnés pour votre peau',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1920&h=800&fit=crop',
    cta_text: 'Voir nos soins',
    cta_link: '/categories/skin-care',
  },
]
