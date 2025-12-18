'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { FiCalendar, FiClock, FiUser, FiPhone, FiMail, FiCheck, FiX, FiRefreshCw, FiFilter } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface Appointment {
  id: number
  service_name: string
  scheduled_date: string
  duration_minutes: number
  status: string
  client_name: string
  client_email: string
  client_phone: string
  user_email: string | null
  is_today: boolean
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'No-show',
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState({
    total_appointments: 0,
    pending_appointments: 0,
    confirmed_appointments: 0,
    today_appointments: 0,
    no_show_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    loadAppointments()
    loadStats()
  }, [skip, statusFilter, dateFilter])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', limit.toString())
      if (statusFilter) params.append('status', statusFilter)
      if (dateFilter) params.append('date_from', dateFilter)

      const { data } = await axios.get(`${API_URL}/appointments/admin/all?${params.toString()}`)
      setAppointments(data.appointments || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Erreur chargement RDV:', error)
      // Données de démo
      setAppointments([
        { id: 1, service_name: 'Pose de mèches', scheduled_date: new Date().toISOString(), duration_minutes: 120, status: 'confirmed', client_name: 'Marie Dupont', client_email: 'marie@example.com', client_phone: '514-555-1234', user_email: null, is_today: true, created_at: new Date().toISOString() },
        { id: 2, service_name: 'Soin visage', scheduled_date: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 60, status: 'pending', client_name: 'Sophie Martin', client_email: 'sophie@example.com', client_phone: '514-555-5678', user_email: null, is_today: false, created_at: new Date().toISOString() },
      ])
      setTotal(2)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/appointments/admin/stats`)
      setStats(data)
    } catch (error) {
      console.error('Erreur stats:', error)
      setStats({
        total_appointments: 45,
        pending_appointments: 8,
        confirmed_appointments: 12,
        today_appointments: 5,
        no_show_rate: 3.5
      })
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedAppointment || !newStatus) return

    try {
      await axios.put(`${API_URL}/appointments/${selectedAppointment.id}/status`, null, {
        params: {
          status: newStatus,
          admin_notes: adminNotes || undefined
        }
      })
      setShowModal(false)
      setSelectedAppointment(null)
      setNewStatus('')
      setAdminNotes('')
      loadAppointments()
      loadStats()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  const openStatusModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setNewStatus(appointment.status)
    setShowModal(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Rendez-vous</h1>
              <p className="text-gray-600 mt-1">Suivi et gestion des réservations</p>
            </div>
            <button
              onClick={() => { loadAppointments(); loadStats(); }}
              className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiRefreshCw className="w-5 h-5" />
              <span>Actualiser</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total RDV</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_appointments}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FiCalendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.today_appointments}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <FiClock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_appointments}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <FiClock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed_appointments}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <FiCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux No-show</p>
                  <p className="text-2xl font-bold text-red-600">{stats.no_show_rate}%</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <FiX className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <FiFilter className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setSkip(0); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="no_show">No-show</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <FiCalendar className="text-gray-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setSkip(0); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Tableau des RDV */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                Aucun rendez-vous trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className={`hover:bg-gray-50 ${appointment.is_today ? 'bg-pink-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center">
                              {appointment.is_today && (
                                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                              )}
                              {formatDate(appointment.scheduled_date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTime(appointment.scheduled_date)} ({formatDuration(appointment.duration_minutes)})
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{appointment.service_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <FiUser className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{appointment.client_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <FiMail className="w-4 h-4" />
                              <span>{appointment.client_email}</span>
                            </div>
                            {appointment.client_phone && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <FiPhone className="w-4 h-4" />
                                <span>{appointment.client_phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABELS[appointment.status] || appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openStatusModal(appointment)}
                            className="px-3 py-1 bg-pink-100 text-pink-700 hover:bg-pink-200 rounded-lg text-sm font-medium transition-colors"
                          >
                            Modifier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {total > limit && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Affichage {skip + 1} - {Math.min(skip + limit, total)} sur {total}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSkip(Math.max(0, skip - limit))}
                    disabled={skip === 0}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setSkip(skip + limit)}
                    disabled={skip + limit >= total}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal mise à jour statut */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Modifier le rendez-vous
            </h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{selectedAppointment.service_name}</p>
              <p className="text-sm text-gray-600">{selectedAppointment.client_name}</p>
              <p className="text-sm text-gray-500">
                {formatDate(selectedAppointment.scheduled_date)} à {formatTime(selectedAppointment.scheduled_date)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau statut
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="no_show">No-show</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes admin (optionnel)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes internes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}
