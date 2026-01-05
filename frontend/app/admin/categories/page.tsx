'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import Toast, { getAuthHeaders } from '@/components/Toast'
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiGrid, FiPackage, FiImage } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  product_count: number
  is_active?: boolean
  sort_order?: number
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    sort_order: 0
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API_URL}/admin/categories`, {
        headers: getAuthHeaders()
      })
      setCategories(data.categories || [])
    } catch (error: any) {
      console.error('Erreur chargement catégories:', error)
      if (error.response?.status === 401) {
        showToast('Session expirée. Veuillez vous reconnecter.', 'error')
      }
      // Fallback vers l'API publique
      try {
        const { data } = await axios.get(`${API_URL}/products/categories`, {
          headers: getAuthHeaders()
        })
        setCategories(data.categories || [])
      } catch {
        setCategories([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation côté client
    if (!formData.name.trim()) {
      showToast('Le nom de la catégorie est obligatoire', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      const params = new URLSearchParams()
      params.append('name', formData.name.trim())
      if (formData.description) params.append('description', formData.description)
      if (formData.image_url) params.append('image_url', formData.image_url)
      params.append('sort_order', formData.sort_order.toString())

      const headers = getAuthHeaders()

      if (editingCategory) {
        await axios.put(`${API_URL}/admin/categories/${editingCategory.id}?${params.toString()}`, null, { headers })
        showToast(`Catégorie "${formData.name}" mise à jour avec succès !`, 'success')
      } else {
        await axios.post(`${API_URL}/admin/categories?${params.toString()}`, null, { headers })
        showToast(`Catégorie "${formData.name}" créée avec succès !`, 'success')
      }

      setShowModal(false)
      resetForm()
      loadCategories()
    } catch (error: any) {
      console.error('Erreur:', error)
      const message = error.response?.data?.detail || 'Erreur lors de l\'enregistrement'
      if (error.response?.status === 401) {
        showToast('Session expirée. Veuillez vous reconnecter.', 'error')
      } else {
        showToast(message, 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      sort_order: category.sort_order || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return

    try {
      await axios.delete(`${API_URL}/admin/categories/${categoryId}`, {
        headers: getAuthHeaders()
      })
      showToast(`Catégorie "${categoryName}" supprimée avec succès !`, 'success')
      loadCategories()
    } catch (error: any) {
      console.error('Erreur:', error)
      const message = error.response?.data?.detail || 'Erreur lors de la suppression'
      showToast(message, 'error')
    }
  }

  const resetForm = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
      image_url: '',
      sort_order: 0
    })
  }

  return (
    <AdminPageWrapper>
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Catégories</h1>
              <p className="text-gray-600 mt-1">Organisez vos produits par catégories</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadCategories}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                <span>Nouvelle catégorie</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Catégories</p>
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FiGrid className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Produits</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {categories.reduce((acc, cat) => acc + cat.product_count, 0)}
                  </p>
                </div>
                <div className="bg-pink-100 p-3 rounded-lg">
                  <FiPackage className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Moyenne produits/catégorie</p>
                  <p className="text-2xl font-bold text-green-600">
                    {categories.length > 0
                      ? Math.round(categories.reduce((acc, cat) => acc + cat.product_count, 0) / categories.length)
                      : 0
                    }
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <FiPackage className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Liste des catégories */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <FiGrid className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucune catégorie trouvée</p>
                <button
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className="mt-4 text-pink-600 hover:underline"
                >
                  Créer votre première catégorie
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {categories.map((category) => (
                  <div key={category.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Image */}
                    <div className="h-40 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiImage className="w-16 h-16 text-pink-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{category.name}</h3>
                          <p className="text-sm text-gray-500">{category.slug}</p>
                        </div>
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">
                          {category.product_count} produits
                        </span>
                      </div>

                      {category.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      <div className="flex justify-end space-x-2 pt-2 border-t">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, category.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Ex: Mèches, Soins, Accessoires..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Description de la catégorie..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de l'image
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">Les catégories avec un ordre plus petit s'affichent en premier</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    editingCategory ? 'Enregistrer' : 'Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}
