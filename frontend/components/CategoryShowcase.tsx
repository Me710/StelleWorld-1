'use client'

import Link from 'next/link'
import Image from 'next/image'

const categories = [
  {
    name: 'Mèches',
    slug: 'meches',
    description: 'Mèches de qualité premium pour tous les styles',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop',
    color: 'from-pink-500 to-rose-600',
  },
  {
    name: 'Skin Care',
    slug: 'skin-care',
    description: 'Produits de soins pour une peau éclatante',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    name: 'Rendez-vous',
    slug: 'rendez-vous',
    description: 'Services personnalisés par nos experts',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop',
    color: 'from-blue-500 to-cyan-600',
  },
]

export default function CategoryShowcase() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Nos Catégories</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez notre sélection de produits et services pour sublimer votre beauté
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Image de fond */}
              <div className="relative h-80">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 group-hover:opacity-70 transition-opacity`} />
              </div>

              {/* Contenu */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                <h3 className="text-2xl font-bold mb-2 group-hover:transform group-hover:translate-x-2 transition-transform">
                  {category.name}
                </h3>
                <p className="text-sm opacity-90 mb-4">{category.description}</p>
                <span className="inline-flex items-center text-sm font-semibold group-hover:translate-x-2 transition-transform">
                  Découvrir
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
