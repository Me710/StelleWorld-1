'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiTrash2, FiRefreshCw, FiMessageCircle } from 'react-icons/fi'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface FAQ {
  id: number
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    sort_order: 0
  })

  useEffect(() => {
    loadFAQs()
  }, [])

  const loadFAQs = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API_URL}/faq/all`)
      setFaqs(data.faqs || [])
    } catch (error) {
      console.error('Erreur:', error)
      // Essayer l'endpoint public
      try {
        const { data } = await axios.get(`${API_URL}/faq/`)
        setFaqs(data.faqs || [])
      } catch {
        setFaqs([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const params = new URLSearchParams()
      params.append('question', formData.question)
      params.append('answer', formData.answer)
      params.append('sort_order', formData.sort_order.toString())

      await axios.post(`${API_URL}/faq/?${params.toString()}`)

      setShowModal(false)
      resetForm()
      loadFAQs()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création. Vérifiez que vous êtes connecté en tant qu\'admin.')
    }
  }

  const handleDelete = async (faqId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette FAQ ?')) return

    try {
      await axios.delete(`${API_URL}/faq/${faqId}`)
      loadFAQs()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      sort_order: faqs.length
    })
  }

  return (
    <AdminPageWrapper>
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion FAQ</h1>
              <p className="text-gray-600 mt-1">Gérez les questions fréquemment posées</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadFAQs}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                <span>Nouvelle FAQ</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total FAQ</p>
                <p className="text-2xl font-bold text-gray-900">{faqs.length}</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-lg">
                <FiMessageCircle className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          {/* Liste des FAQ */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des FAQ...</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <FiMessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucune FAQ trouvée</p>
                <button
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className="mt-4 text-pink-600 hover:underline"
                >
                  Créer votre première FAQ
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {faqs.map((faq) => (
                  <div key={faq.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {faq.answer}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
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

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 my-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Nouvelle FAQ
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Ex: Combien coûte la livraison ?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réponse *
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Votre réponse détaillée..."
                />
              </div>

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
                  Créer la FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}

