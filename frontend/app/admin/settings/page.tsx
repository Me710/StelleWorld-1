'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { FiSave, FiRefreshCw, FiEye, FiEyeOff, FiPlus, FiEdit, FiTrash2, FiImage, FiArrowUp, FiArrowDown, FiMessageSquare } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface BannerSettings {
  message: string
  backgroundColor: string
  textColor: string
  isActive: boolean
  link?: string
}

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

type TabType = 'banner' | 'slider'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('banner')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Bannière
  const [banner, setBanner] = useState<BannerSettings>({
    message: '🎉 PROMOTION : -30% sur une sélection de produits avec le code PROMO30',
    backgroundColor: '#ec4899',
    textColor: '#ffffff',
    isActive: true,
    link: ''
  })

  // Hero Slider
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [showSlideModal, setShowSlideModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    cta_text: '',
    cta_link: '',
    sort_order: 0,
    is_active: true
  })

  useEffect(() => {
    loadAllSettings()
  }, [])

  const loadAllSettings = async () => {
    setLoading(true)
    await Promise.all([loadBannerSettings(), loadSlides()])
    setLoading(false)
  }

  // ========== BANNIÈRE ==========
  const loadBannerSettings = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/settings/promo_banner`)
      if (data.value) {
        const parsed = JSON.parse(data.value)
        setBanner({
          message: parsed.message || '',
          backgroundColor: parsed.backgroundColor || '#ec4899',
          textColor: parsed.textColor || '#ffffff',
          isActive: parsed.isActive !== false,
          link: parsed.link || ''
        })
      }
    } catch (error) {
      console.error('Erreur chargement bannière:', error)
    }
  }

  const saveBannerSettings = async () => {
    setSaving(true)
    try {
      const value = JSON.stringify(banner)
      await axios.put(`${API_URL}/settings/promo_banner?value=${encodeURIComponent(value)}&description=Bannière promotionnelle`)
      alert('Bannière sauvegardée avec succès!')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // ========== HERO SLIDER ==========
  const loadSlides = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/hero-slides`)
      setSlides(data.slides || [])
    } catch (error) {
      console.error('Erreur:', error)
      setSlides([])
    }
  }

  const handleSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const params = new URLSearchParams()
      params.append('title', slideForm.title)
      params.append('image_url', slideForm.image_url)
      if (slideForm.subtitle) params.append('subtitle', slideForm.subtitle)
      if (slideForm.cta_text) params.append('cta_text', slideForm.cta_text)
      if (slideForm.cta_link) params.append('cta_link', slideForm.cta_link)
      params.append('sort_order', slideForm.sort_order.toString())
      params.append('is_active', slideForm.is_active.toString())

      if (editingSlide) {
        await axios.put(`${API_URL}/hero-slides/${editingSlide.id}?${params.toString()}`)
      } else {
        await axios.post(`${API_URL}/hero-slides?${params.toString()}`)
      }

      setShowSlideModal(false)
      resetSlideForm()
      loadSlides()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'enregistrement')
    }
  }

  const handleEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setSlideForm({
      title: slide.title,
      subtitle: slide.subtitle || '',
      image_url: slide.image_url,
      cta_text: slide.cta_text || '',
      cta_link: slide.cta_link || '',
      sort_order: slide.sort_order,
      is_active: slide.is_active !== false
    })
    setShowSlideModal(true)
  }

  const handleDeleteSlide = async (slideId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce slide ?')) return
    try {
      await axios.delete(`${API_URL}/hero-slides/${slideId}`)
      loadSlides()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleToggleSlideActive = async (slide: HeroSlide) => {
    try {
      await axios.put(`${API_URL}/hero-slides/${slide.id}?is_active=${!slide.is_active}`)
      loadSlides()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleMoveSlide = async (slide: HeroSlide, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? Math.max(0, slide.sort_order - 1) : slide.sort_order + 1
    try {
      await axios.put(`${API_URL}/hero-slides/${slide.id}?sort_order=${newOrder}`)
      loadSlides()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const resetSlideForm = () => {
    setEditingSlide(null)
    setSlideForm({
      title: '',
      subtitle: '',
      image_url: '',
      cta_text: '',
      cta_link: '',
      sort_order: slides.length,
      is_active: true
    })
  }

  const tabs = [
    { id: 'banner' as TabType, name: 'Bannière Promo', icon: FiMessageSquare },
    { id: 'slider' as TabType, name: 'Hero Slider', icon: FiImage },
  ]

  return (
    <AdminPageWrapper>
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paramètres du Site</h1>
              <p className="text-gray-600 mt-1">Personnalisez l'apparence de votre boutique</p>
            </div>
            <button
              onClick={loadAllSettings}
              disabled={loading}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Onglets */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              </div>
            ) : (
              <div className="p-6">
                {/* ========== TAB BANNIÈRE ========== */}
                {activeTab === 'banner' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Bannière Promotionnelle</h2>
                      <button
                        onClick={() => setBanner({ ...banner, isActive: !banner.isActive })}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${banner.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {banner.isActive ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                        <span className="text-sm font-medium">{banner.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>

                    {/* Prévisualisation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prévisualisation</label>
                      <div
                        className="w-full py-3 px-4 text-center font-semibold text-sm rounded-lg"
                        style={{ backgroundColor: banner.backgroundColor, color: banner.textColor }}
                      >
                        {banner.message || 'Votre message ici...'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                          <input
                            type="text"
                            value={banner.message}
                            onChange={(e) => setBanner({ ...banner, message: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                            placeholder="Ex: 🎉 PROMO -30% avec le code PROMO30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lien (optionnel)</label>
                          <input
                            type="text"
                            value={banner.link}
                            onChange={(e) => setBanner({ ...banner, link: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                            placeholder="Ex: /products?promo=true"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur de fond</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={banner.backgroundColor}
                                onChange={(e) => setBanner({ ...banner, backgroundColor: e.target.value })}
                                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={banner.backgroundColor}
                                onChange={(e) => setBanner({ ...banner, backgroundColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur du texte</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={banner.textColor}
                                onChange={(e) => setBanner({ ...banner, textColor: e.target.value })}
                                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={banner.textColor}
                                onChange={(e) => setBanner({ ...banner, textColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Thèmes rapides</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { bg: '#ec4899', text: '#ffffff', name: 'Rose' },
                              { bg: '#8b5cf6', text: '#ffffff', name: 'Violet' },
                              { bg: '#3b82f6', text: '#ffffff', name: 'Bleu' },
                              { bg: '#10b981', text: '#ffffff', name: 'Vert' },
                              { bg: '#f59e0b', text: '#000000', name: 'Orange' },
                              { bg: '#ef4444', text: '#ffffff', name: 'Rouge' },
                              { bg: '#1f2937', text: '#ffffff', name: 'Noir' },
                            ].map((theme) => (
                              <button
                                key={theme.name}
                                onClick={() => setBanner({ ...banner, backgroundColor: theme.bg, textColor: theme.text })}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:border-gray-400 transition-colors"
                                style={{ backgroundColor: theme.bg, color: theme.text }}
                              >
                                {theme.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <button
                        onClick={saveBannerSettings}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        <FiSave className="w-5 h-5" />
                        <span>{saving ? 'Sauvegarde...' : 'Sauvegarder la bannière'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ========== TAB HERO SLIDER ========== */}
                {activeTab === 'slider' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Gestion du Hero Slider</h2>
                      <button
                        onClick={() => { resetSlideForm(); setShowSlideModal(true); }}
                        className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <FiPlus className="w-5 h-5" />
                        <span>Nouveau slide</span>
                      </button>
                    </div>

                    {/* Stats slides */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{slides.length}</p>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{slides.filter(s => s.is_active !== false).length}</p>
                        <p className="text-sm text-gray-600">Actifs</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-gray-400">{slides.filter(s => s.is_active === false).length}</p>
                        <p className="text-sm text-gray-600">Inactifs</p>
                      </div>
                    </div>

                    {/* Liste des slides */}
                    {slides.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FiImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>Aucun slide trouvé</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg divide-y divide-gray-200">
                        {slides.map((slide, index) => (
                          <div key={slide.id} className={`p-4 flex items-center gap-4 hover:bg-gray-50 ${slide.is_active === false ? 'opacity-50' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <button onClick={() => handleMoveSlide(slide, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                <FiArrowUp className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-medium text-gray-500">{slide.sort_order}</span>
                              <button onClick={() => handleMoveSlide(slide, 'down')} disabled={index === slides.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                <FiArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="relative w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                              {slide.image_url ? (
                                <Image src={slide.image_url} alt={slide.title} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><FiImage className="w-6 h-6 text-gray-400" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{slide.title}</h3>
                              {slide.subtitle && <p className="text-sm text-gray-500 truncate">{slide.subtitle}</p>}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleToggleSlideActive(slide)} className={`p-2 rounded-lg ${slide.is_active !== false ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                                {slide.is_active !== false ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                              </button>
                              <button onClick={() => handleEditSlide(slide)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <FiEdit className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDeleteSlide(slide.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal création/édition slide */}
      {showSlideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingSlide ? 'Modifier le slide' : 'Nouveau slide'}
            </h2>
            <form onSubmit={handleSlideSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input type="text" value={slideForm.title} onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
                  <input type="text" value={slideForm.subtitle} onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'image *</label>
                <input type="url" value={slideForm.image_url} onChange={(e) => setSlideForm({ ...slideForm, image_url: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                {slideForm.image_url && (
                  <div className="mt-2 relative h-32 rounded-lg overflow-hidden bg-gray-100">
                    <Image src={slideForm.image_url} alt="Preview" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bouton</label>
                  <input type="text" value={slideForm.cta_text} onChange={(e) => setSlideForm({ ...slideForm, cta_text: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lien du bouton</label>
                  <input type="text" value={slideForm.cta_link} onChange={(e) => setSlideForm({ ...slideForm, cta_link: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={slideForm.is_active} onChange={(e) => setSlideForm({ ...slideForm, is_active: e.target.checked })} className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                  <span className="text-sm text-gray-700">Slide actif</span>
                </label>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Ordre:</label>
                  <input type="number" min="0" value={slideForm.sort_order} onChange={(e) => setSlideForm({ ...slideForm, sort_order: parseInt(e.target.value) || 0 })} className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowSlideModal(false); resetSlideForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg">{editingSlide ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}
