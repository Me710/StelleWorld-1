'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiSearch, FiClock, FiDollarSign, FiMapPin, FiStar } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface Service {
  id: number
  name: string
  slug: string
  duration_minutes: number
  price: number
  is_active: boolean
  is_featured: boolean
  category_name: string | null
  booking_count: number
  created_at: string
}

interface ServiceCategory {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
  is_active: boolean
  service_count: number
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    duration_minutes: 60,
    description: '',
    short_description: '',
    category_id: '',
    location_type: 'office',
    can_be_at_home: false,
    home_service_fee: 0,
    is_featured: false,
    main_image_url: ''
  })

  useEffect(() => {
    loadServices()
    loadCategories()
  }, [])

  const loadServices = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API_URL}/services/admin/all`)
      setServices(data.services || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Erreur chargement services:', error)
      // Données de démo
      setServices([
        { id: 1, name: 'Pose de mèches complète', slug: 'pose-meches-complete', duration_minutes: 120, price: 150, is_active: true, is_featured: true, category_name: 'Capillaire', booking_count: 45, created_at: new Date().toISOString() },
        { id: 2, name: 'Soin du visage', slug: 'soin-visage', duration_minutes: 60, price: 75, is_active: true, is_featured: false, category_name: 'Soins', booking_count: 23, created_at: new Date().toISOString() },
      ])
      setTotal(2)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/services/admin/categories/all`)
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
      setCategories([
        { id: 1, name: 'Capillaire', slug: 'capillaire', description: 'Services capillaires', icon: 'scissors', color: '#EC4899', is_active: true, service_count: 5 },
        { id: 2, name: 'Soins', slug: 'soins', description: 'Soins de la peau', icon: 'spa', color: '#8B5CF6', is_active: true, service_count: 3 },
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingService) {
        await axios.put(`${API_URL}/services/admin/${editingService.id}`, null, {
          params: {
            name: formData.name,
            price: formData.price,
            duration_minutes: formData.duration_minutes,
            description: formData.description || undefined,
            short_description: formData.short_description || undefined,
            category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
            location_type: formData.location_type,
            can_be_at_home: formData.can_be_at_home,
            home_service_fee: formData.home_service_fee,
            is_featured: formData.is_featured,
            main_image_url: formData.main_image_url || undefined
          }
        })
      } else {
        await axios.post(`${API_URL}/services/admin`, null, {
          params: {
            name: formData.name,
            price: formData.price,
            duration_minutes: formData.duration_minutes,
            description: formData.description || undefined,
            short_description: formData.short_description || undefined,
            category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
            location_type: formData.location_type,
            can_be_at_home: formData.can_be_at_home,
            home_service_fee: formData.home_service_fee,
            is_featured: formData.is_featured,
            main_image_url: formData.main_image_url || undefined
          }
        })
      }

      setShowModal(false)
      resetForm()
      loadServices()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'enregistrement')
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes,
      description: '',
      short_description: '',
      category_id: '',
      location_type: 'office',
      can_be_at_home: false,
      home_service_fee: 0,
      is_featured: service.is_featured,
      main_image_url: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (serviceId: number) => {
    if (!confirm('Voulez-vous vraiment désactiver ce service ?')) return

    try {
      await axios.delete(`${API_URL}/services/admin/${serviceId}`)
      loadServices()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleToggleFeatured = async (service: Service) => {
    try {
      await axios.put(`${API_URL}/services/admin/${service.id}`, null, {
        params: { is_featured: !service.is_featured }
      })
      loadServices()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const resetForm = () => {
    setEditingService(null)
    setFormData({
      name: '',
      price: 0,
      duration_minutes: 60,
      description: '',
      short_description: '',
      category_id: '',
      location_type: 'office',
      can_be_at_home: false,
      home_service_fee: 0,
      is_featured: false,
      main_image_url: ''
    })
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins} min`
    if (mins === 0) return `${hours}h`
    return `${hours}h${mins}`
  }

  return (
    <AdminPageWrapper>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Services</h1>
              <p className="text-gray-600 mt-1">Services de rendez-vous personnalisables</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadServices}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                <span>Nouveau service</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Services Actifs</p>
              <p className="text-2xl font-bold text-green-600">{services.filter(s => s.is_active).length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">En Vedette</p>
              <p className="text-2xl font-bold text-pink-600">{services.filter(s => s.is_featured).length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600">Réservations Totales</p>
              <p className="text-2xl font-bold text-blue-600">{services.reduce((acc, s) => acc + s.booking_count, 0)}</p>
            </div>
          </div>

          {/* Recherche */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Liste des services */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                Aucun service trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RDV</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-semibold text-gray-900">{service.name}</div>
                              <div className="text-sm text-gray-500">{service.slug}</div>
                            </div>
                            {service.is_featured && (
                              <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            {service.category_name || 'Non catégorisé'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <FiClock className="w-4 h-4" />
                            <span>{formatDuration(service.duration_minutes)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-pink-600">{service.price.toFixed(2)} $</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${service.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {service.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {service.booking_count}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleFeatured(service)}
                              className={`p-2 rounded-lg transition-colors ${service.is_featured
                                  ? 'text-yellow-600 hover:bg-yellow-50'
                                  : 'text-gray-400 hover:bg-gray-50'
                                }`}
                              title={service.is_featured ? 'Retirer des vedettes' : 'Mettre en vedette'}
                            >
                              <FiStar className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(service)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <FiEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(service.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              {editingService ? 'Modifier le service' : 'Nouveau service'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Durée (minutes) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description complète
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de lieu
                  </label>
                  <select
                    value={formData.location_type}
                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="office">Au salon</option>
                    <option value="home">À domicile uniquement</option>
                    <option value="online">En ligne</option>
                    <option value="any">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Image
                  </label>
                  <input
                    type="url"
                    value={formData.main_image_url}
                    onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.can_be_at_home}
                    onChange={(e) => setFormData({ ...formData, can_be_at_home: e.target.checked })}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Service à domicile disponible</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">Mettre en vedette</span>
                </label>
              </div>

              {formData.can_be_at_home && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frais supplémentaires à domicile ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.home_service_fee}
                    onChange={(e) => setFormData({ ...formData, home_service_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
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
                  {editingService ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}
