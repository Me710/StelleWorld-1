'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiImage, FiEye, FiEyeOff, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface HeroSlide {
  id: number
  title: string
  subtitle: string | null
  image_url: string
  cta_text: string | null
  cta_link: string | null
  sort_order: number
  is_active?: boolean
}

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    cta_text: '',
    cta_link: '',
    sort_order: 0,
    is_active: true
  })

  useEffect(() => {
    loadSlides()
  }, [])

  const loadSlides = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API_URL}/hero-slides`)
      setSlides(data.slides || [])
    } catch (error) {
      console.error('Erreur:', error)
      setSlides([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const params = new URLSearchParams()
      params.append('title', formData.title)
      params.append('image_url', formData.image_url)
      if (formData.subtitle) params.append('subtitle', formData.subtitle)
      if (formData.cta_text) params.append('cta_text', formData.cta_text)
      if (formData.cta_link) params.append('cta_link', formData.cta_link)
      params.append('sort_order', formData.sort_order.toString())
      params.append('is_active', formData.is_active.toString())

      if (editingSlide) {
        await axios.put(`${API_URL}/hero-slides/${editingSlide.id}?${params.toString()}`)
      } else {
        await axios.post(`${API_URL}/hero-slides?${params.toString()}`)
      }

      setShowModal(false)
      resetForm()
      loadSlides()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'enregistrement')
    }
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      image_url: slide.image_url,
      cta_text: slide.cta_text || '',
      cta_link: slide.cta_link || '',
      sort_order: slide.sort_order,
      is_active: slide.is_active !== false
    })
    setShowModal(true)
  }

  const handleDelete = async (slideId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce slide ?')) return

    try {
      await axios.delete(`${API_URL}/hero-slides/${slideId}`)
      loadSlides()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      await axios.put(`${API_URL}/hero-slides/${slide.id}?is_active=${!slide.is_active}`)
      loadSlides()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleMoveUp = async (slide: HeroSlide) => {
    const newOrder = Math.max(0, slide.sort_order - 1)
    try {
      await axios.put(`${API_URL}/hero-slides/${slide.id}?sort_order=${newOrder}`)
      loadSlides()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleMoveDown = async (slide: HeroSlide) => {
    try {
      await axios.put(`${API_URL}/hero-slides/${slide.id}?sort_order=${slide.sort_order + 1}`)
      loadSlides()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const resetForm = () => {
    setEditingSlide(null)
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      cta_text: '',
      cta_link: '',
      sort_order: slides.length,
      is_active: true
    })
  }

  return (
    <AdminPageWrapper>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion Hero Slider</h1>
              <p className="text-gray-600 mt-1">Gérez les slides de la page d'accueil</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadSlides}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                <span>Nouveau slide</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Slides</p>
                  <p className="text-2xl font-bold text-gray-900">{slides.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FiImage className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Slides Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {slides.filter(s => s.is_active !== false).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Slides Inactifs</p>
              <p className="text-2xl font-bold text-gray-400">
                {slides.filter(s => s.is_active === false).length}
              </p>
            </div>
          </div>

          {/* Liste des slides */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des slides...</p>
              </div>
            ) : slides.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <FiImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucun slide trouvé</p>
                <button
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className="mt-4 text-pink-600 hover:underline"
                >
                  Créer votre premier slide
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {slides.map((slide, index) => (
                  <div key={slide.id} className={`p-4 flex items-center gap-4 hover:bg-gray-50 ${slide.is_active === false ? 'opacity-50' : ''}`}>
                    {/* Ordre */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(slide)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <FiArrowUp className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-500 w-6 text-center">{slide.sort_order}</span>
                      <button
                        onClick={() => handleMoveDown(slide)}
                        disabled={index === slides.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <FiArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Image */}
                    <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      {slide.image_url ? (
                        <Image
                          src={slide.image_url}
                          alt={slide.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiImage className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{slide.title}</h3>
                      {slide.subtitle && (
                        <p className="text-sm text-gray-500 truncate">{slide.subtitle}</p>
                      )}
                      {slide.cta_text && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                            {slide.cta_text} → {slide.cta_link}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(slide)}
                        className={`p-2 rounded-lg transition-colors ${slide.is_active !== false
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        title={slide.is_active !== false ? 'Désactiver' : 'Activer'}
                      >
                        {slide.is_active !== false ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(slide)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingSlide ? 'Modifier le slide' : 'Nouveau slide'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Ex: Nouvelle Collection Été"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sous-titre
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Ex: Découvrez nos nouveautés"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de l'image *
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="https://..."
                />
                {formData.image_url && (
                  <div className="mt-2 relative h-32 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={formData.image_url}
                      alt="Preview"
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texte du bouton
                  </label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Ex: Voir la collection"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lien du bouton
                  </label>
                  <input
                    type="text"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Ex: /products"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">Slide actif</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                >
                  {editingSlide ? 'Enregistrer' : 'Créer le slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}
