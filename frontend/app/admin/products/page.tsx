'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiSearch, FiStar, FiPackage } from 'react-icons/fi'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import Toast, { getAuthHeaders } from '@/components/Toast'
import ImageUpload from '@/components/ImageUpload'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'
const BACKEND_URL = API_URL.replace('/api', '')

// Helper pour construire l'URL complète d'une image
const getImageUrl = (url: string | null): string | null => {
  if (!url) return null
  // Si c'est une URL locale (/api/uploads/...), la préfixer avec l'URL du backend
  if (url.startsWith('/api')) {
    return `${BACKEND_URL}${url}`
  }
  // Sinon (Cloudinary ou autre URL complète), la retourner telle quelle
  return url
}

interface Category {
  id: number
  name: string
  slug: string
}

interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price: number
  compare_at_price: number | null
  stock_quantity: number | null
  main_image_url: string | null
  gallery_images: string | null
  is_active: boolean
  is_featured: boolean
  category: Category | null
  sales_count: number
  view_count: number
}

type DeleteMode = 'soft' | 'hard'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: 0,
    compare_at_price: '',
    stock_quantity: 0,
    category_id: '',
    is_featured: false,
    images: [] as string[] // Array of image URLs (first one is main image)
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API_URL}/products/`, {
        params: { limit: 100, include_inactive: true },
        headers: getAuthHeaders()
      })
      setProducts(data.products || [])
      setTotal(data.total || 0)
      setImageErrors(new Set()) // Réinitialiser les erreurs d'image
    } catch (error: any) {
      console.error('Erreur chargement produits:', error)
      if (error.response?.status === 401) {
        showToast('Session expirée. Veuillez vous reconnecter.', 'error')
      }
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products/categories`, {
        headers: getAuthHeaders()
      })
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation côté client
    if (!formData.name.trim()) {
      showToast('Le nom du produit est obligatoire', 'error')
      return
    }
    if (formData.price <= 0) {
      showToast('Le prix doit être supérieur à 0', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      const params = new URLSearchParams()
      params.append('name', formData.name.trim())
      if (formData.description) params.append('description', formData.description)
      if (formData.short_description) params.append('short_description', formData.short_description)
      params.append('price', formData.price.toString())
      params.append('stock_quantity', formData.stock_quantity.toString())
      if (formData.category_id) params.append('category_id', formData.category_id)
      params.append('is_featured', formData.is_featured.toString())
      if (formData.compare_at_price) params.append('compare_at_price', formData.compare_at_price)

      // Gérer les images (première = principale, reste = galerie)
      if (formData.images.length > 0) {
        params.append('main_image_url', formData.images[0])
        if (formData.images.length > 1) {
          params.append('gallery_images', JSON.stringify(formData.images.slice(1)))
        }
      }

      const headers = getAuthHeaders()

      if (editingProduct) {
        // Update
        await axios.put(`${API_URL}/products/${editingProduct.id}?${params.toString()}`, null, { headers })
        showToast(`Produit "${formData.name}" mis à jour avec succès !`, 'success')
      } else {
        // Create
        await axios.post(`${API_URL}/products/?${params.toString()}`, null, { headers })
        showToast(`Produit "${formData.name}" créé avec succès !`, 'success')
      }

      setShowModal(false)
      resetForm()
      loadProducts()
    } catch (error: any) {
      console.error('Erreur:', error)
      const errorMessage = error.response?.data?.detail || error.response?.statusText || 'Erreur inconnue'
      if (error.response?.status === 401) {
        showToast('Session expirée. Veuillez vous reconnecter.', 'error')
      } else if (error.response?.status === 403) {
        showToast('Accès refusé. Vous devez être administrateur.', 'error')
      } else {
        showToast(`Erreur: ${errorMessage}`, 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)

    // Construire le tableau d'images (principale + galerie)
    const images: string[] = []
    if (product.main_image_url) {
      images.push(product.main_image_url)
    }
    if (product.gallery_images) {
      try {
        const parsed = JSON.parse(product.gallery_images)
        if (Array.isArray(parsed)) {
          images.push(...parsed)
        }
      } catch {
        // Si ce n'est pas du JSON, ignorer
      }
    }

    setFormData({
      name: product.name,
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price,
      compare_at_price: product.compare_at_price?.toString() || '',
      stock_quantity: product.stock_quantity || 0,
      category_id: product.category?.id?.toString() || '',
      is_featured: product.is_featured,
      images
    })
    setShowModal(true)
  }

  const handleDelete = async (productId: number, productName: string, forceDelete: boolean = false) => {
    const message = forceDelete
      ? 'Voulez-vous vraiment SUPPRIMER DÉFINITIVEMENT ce produit ? Cette action est irréversible et supprimera toutes les données associées.'
      : 'Voulez-vous désactiver ce produit ? Il ne sera plus visible pour les clients mais restera dans la base de données.'

    if (!confirm(message)) return

    try {
      await axios.delete(`${API_URL}/products/${productId}?force=${forceDelete}`, {
        headers: getAuthHeaders()
      })
      const action = forceDelete ? 'supprimé définitivement' : 'désactivé'
      showToast(`Produit "${productName}" ${action}`, 'success')
      loadProducts()
    } catch (error: any) {
      console.error('Erreur:', error)
      const errorMessage = error.response?.data?.detail || 'Erreur lors de la suppression'
      showToast(errorMessage, 'error')
    }
  }

  const handleReactivate = async (product: Product) => {
    try {
      await axios.put(`${API_URL}/products/${product.id}?is_active=true`, null, {
        headers: getAuthHeaders()
      })
      showToast(`Produit "${product.name}" réactivé`, 'success')
      loadProducts()
    } catch (error: any) {
      console.error('Erreur:', error)
      showToast('Erreur lors de la réactivation', 'error')
    }
  }

  const handleToggleFeatured = async (product: Product) => {
    try {
      await axios.put(`${API_URL}/products/${product.id}?is_featured=${!product.is_featured}`, null, {
        headers: getAuthHeaders()
      })
      const action = !product.is_featured ? 'mis en vedette' : 'retiré des vedettes'
      showToast(`Produit "${product.name}" ${action}`, 'success')
      loadProducts()
    } catch (error: any) {
      console.error('Erreur:', error)
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      short_description: '',
      price: 0,
      compare_at_price: '',
      stock_quantity: 0,
      category_id: '',
      is_featured: false,
      images: []
    })
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
              <p className="text-gray-600 mt-1">Total: {total} produits</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadProducts}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                <span>Nouveau produit</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Produits</p>
                  <p className="text-2xl font-bold text-gray-900">{total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FiPackage className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">En Vedette</p>
              <p className="text-2xl font-bold text-pink-600">{products.filter(p => p.is_featured).length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Stock Faible (&lt;10)</p>
              <p className="text-2xl font-bold text-orange-600">
                {products.filter(p => p.stock_quantity !== null && p.stock_quantity < 10).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Ventes Totales</p>
              <p className="text-2xl font-bold text-green-600">
                {products.reduce((acc, p) => acc + p.sales_count, 0)}
              </p>
            </div>
          </div>

          {/* Recherche */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Liste des produits */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des produits...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <FiPackage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucun produit trouvé</p>
                <button
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className="mt-4 text-pink-600 hover:underline"
                >
                  Créer votre premier produit
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ventes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative h-12 w-12 flex-shrink-0">
                              {product.main_image_url && !imageErrors.has(product.id) ? (
                                <Image
                                  src={getImageUrl(product.main_image_url) || ''}
                                  alt={product.name}
                                  fill
                                  className="object-cover rounded"
                                  unoptimized={product.main_image_url.startsWith('/api')}
                                  onError={() => {
                                    setImageErrors(prev => new Set(prev).add(product.id))
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                  <FiPackage className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900">{product.name}</span>
                                {product.is_featured && (
                                  <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{product.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {product.category ? (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Non catégorisé</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{product.price.toFixed(2)} $</div>
                          {product.compare_at_price && (
                            <div className="text-sm text-gray-500 line-through">
                              {product.compare_at_price.toFixed(2)} $
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {product.stock_quantity !== null ? (
                            <span className={`px-2 py-1 rounded text-sm font-medium ${product.stock_quantity < 10
                              ? 'bg-red-100 text-red-800'
                              : product.stock_quantity < 30
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                              }`}>
                              {product.stock_quantity} unités
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Illimité</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {product.sales_count} ventes
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleFeatured(product)}
                              className={`p-2 rounded-lg transition-colors ${product.is_featured
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-gray-400 hover:bg-gray-50'
                                }`}
                              title={product.is_featured ? 'Retirer des vedettes' : 'Mettre en vedette'}
                            >
                              <FiStar className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <FiEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.name, true)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Ex: Mèches Brésiliennes Premium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Aucune catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description courte
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  maxLength={200}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Brève description du produit..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description complète
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Description détaillée du produit..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix ($ CAD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix comparé ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compare_at_price}
                    onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                    placeholder="Prix barré"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Upload d'images */}
              <ImageUpload
                images={formData.images}
                onChange={(urls) => setFormData({ ...formData, images: urls })}
                maxImages={5}
                label="Images du produit (1-5 images)"
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="is_featured" className="text-sm text-gray-700">
                  Mettre en vedette sur la page d'accueil
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
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
                    editingProduct ? 'Enregistrer' : 'Créer le produit'
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
