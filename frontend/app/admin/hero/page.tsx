'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FiEdit, FiTrash2, FiPlus, FiSave, FiX } from 'react-icons/fi'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function AdminHeroPage() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadSlides()
  }, [])

  const loadSlides = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API_URL}/api/hero-slides`)
      setSlides(data.slides || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData(e.target as HTMLFormElement)
    const slideData = {
      title: formData.get('title'),
      subtitle: formData.get('subtitle'),
      image_url: formData.get('image_url'),
      cta_text: formData.get('cta_text'),
      cta_link: formData.get('cta_link'),
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'on'
    }

    try {
      if (editingSlide) {
        await axios.put(`${API_URL}/api/hero-slides/${editingSlide.id}`, slideData)
        alert('Slide modifié avec succès')
      } else {
        await axios.post(`${API_URL}/api/hero-slides`, slideData)
        alert('Slide créé avec succès')
      }
      
      setShowForm(false)
      setEditingSlide(null)
      loadSlides()
    } catch (error) {
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (slideId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce slide ?')) return
    
    try {
      await axios.delete(`${API_URL}/api/hero-slides/${slideId}`)
      loadSlides()
      alert('Slide supprimé avec succès')
    } catch (error) {
      alert('Erreur lors de la suppression')
    }
  }

  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        {/* Header */}
        <div className=\"flex justify-between items-center mb-8\">
          <div>
            <h1 className=\"text-3xl font-bold text-gray-900\">Gestion Hero Slider</h1>
            <p className=\"text-gray-600 mt-2\">Gérez les slides de votre page d'accueil</p>
          </div>
          <button
            onClick={() => {
              setEditingSlide(null)
              setShowForm(true)
            }}
            className=\"bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors\"
          >
            <FiPlus className=\"w-5 h-5\" />
            <span>Nouveau Slide</span>
          </button>
        </div>

        {/* Formulaire de création/édition */}
        {showForm && (
          <div className=\"bg-white rounded-lg shadow-lg p-6 mb-8\">
            <div className=\"flex justify-between items-center mb-6\">
              <h2 className=\"text-xl font-bold text-gray-900\">
                {editingSlide ? 'Modifier le Slide' : 'Nouveau Slide'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingSlide(null)
                }}
                className=\"text-gray-500 hover:text-gray-700\"
              >
                <FiX className=\"w-6 h-6\" />
              </button>
            </div>

            <form onSubmit={handleSave} className=\"space-y-4\">
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Titre *
                </label>
                <input
                  type=\"text\"
                  name=\"title\"
                  defaultValue={editingSlide?.title}
                  required
                  className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500\"
                />
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Sous-titre
                </label>
                <textarea
                  name=\"subtitle\"
                  defaultValue={editingSlide?.subtitle}
                  rows={2}
                  className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500\"
                />
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  URL de l'image *
                </label>
                <input
                  type=\"url\"
                  name=\"image_url\"
                  defaultValue={editingSlide?.image_url}
                  required
                  placeholder=\"https://images.unsplash.com/...\"
                  className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500\"
                />
              </div>

              <div className=\"grid grid-cols-2 gap-4\">
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                    Texte du bouton
                  </label>
                  <input
                    type=\"text\"
                    name=\"cta_text\"
                    defaultValue={editingSlide?.cta_text}
                    placeholder=\"Découvrir\"
                    className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500\"
                  />
                </div>
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                    Lien du bouton
                  </label>
                  <input
                    type=\"text\"
                    name=\"cta_link\"
                    defaultValue={editingSlide?.cta_link}
                    placeholder=\"/categories/meches\"
                    className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500\"
                  />
                </div>
              </div>

              <div className=\"grid grid-cols-2 gap-4\">
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                    Ordre d'affichage
                  </label>
                  <input
                    type=\"number\"
                    name=\"sort_order\"
                    defaultValue={editingSlide?.sort_order || 0}
                    className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500\"
                  />
                </div>
                <div className=\"flex items-end\">
                  <label className=\"flex items-center space-x-2\">
                    <input
                      type=\"checkbox\"
                      name=\"is_active\"
                      defaultChecked={editingSlide?.is_active !== false}
                      className=\"w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500\"
                    />
                    <span className=\"text-sm font-medium text-gray-700\">Slide actif</span>
                  </label>
                </div>
              </div>

              <div className=\"flex justify-end space-x-4 pt-4\">
                <button
                  type=\"button\"
                  onClick={() => {
                    setShowForm(false)
                    setEditingSlide(null)
                  }}
                  className=\"px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors\"
                >
                  Annuler
                </button>
                <button
                  type=\"submit\"
                  className=\"bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors\"
                >
                  <FiSave className=\"w-5 h-5\" />
                  <span>Sauvegarder</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des slides */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
          {slides.map((slide: any) => (
            <div key={slide.id} className=\"bg-white rounded-lg shadow-md overflow-hidden\">
              <div className=\"relative h-48\">
                <Image
                  src={slide.image_url}
                  alt={slide.title}
                  fill
                  className=\"object-cover\"
                />
                <div className=\"absolute top-2 right-2 bg-gray-900 text-white px-2 py-1 rounded text-xs\">
                  Ordre: {slide.sort_order}
                </div>
              </div>
              <div className=\"p-4\">
                <h3 className=\"font-bold text-gray-900 mb-2\">{slide.title}</h3>
                {slide.subtitle && (
                  <p className=\"text-sm text-gray-600 mb-3\">{slide.subtitle}</p>
                )}
                {slide.cta_text && (
                  <div className=\"text-sm text-gray-600 mb-3\">
                    <span className=\"font-semibold\">CTA:</span> {slide.cta_text} → {slide.cta_link}
                  </div>
                )}
                <div className=\"flex justify-end space-x-2\">
                  <button
                    onClick={() => {
                      setEditingSlide(slide)
                      setShowForm(true)
                    }}
                    className=\"text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50\"
                  >
                    <FiEdit className=\"w-5 h-5\" />
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className=\"text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50\"
                  >
                    <FiTrash2 className=\"w-5 h-5\" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {slides.length === 0 && !loading && (
          <div className=\"bg-white rounded-lg shadow-md p-12 text-center\">
            <div className=\"text-6xl mb-4\">🖼️</div>
            <h3 className=\"text-xl font-bold text-gray-900 mb-2\">Aucun slide</h3>
            <p className=\"text-gray-600 mb-6\">Créez votre premier slide pour le hero slider</p>
            <button
              onClick={() => setShowForm(true)}
              className=\"inline-flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors\"
            >
              <FiPlus className=\"w-5 h-5\" />
              <span>Créer un slide</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
