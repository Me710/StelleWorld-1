'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { FiFileText, FiDollarSign, FiCheck, FiClock, FiRefreshCw, FiSearch, FiDownload, FiEye } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface Invoice {
  id: number
  invoice_number: string
  order_id: number
  user_name: string
  user_email: string
  subtotal: number
  tax_amount: number
  total_amount: number
  status: string
  is_paid: boolean
  payment_method: string
  invoice_date: string
  due_date: string | null
  paid_at: string | null
}

interface InvoiceStats {
  customer_invoices: {
    total: number
    total_revenue: number
    pending: number
  }
  supplier_invoices: {
    total: number
    total_expenses: number
    pending: number
  }
  net_profit: number
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers')

  useEffect(() => {
    loadInvoices()
    loadStats()
  }, [skip, statusFilter, activeTab])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', limit.toString())
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const endpoint = activeTab === 'customers' ? 'customers' : 'suppliers'
      const { data } = await axios.get(`${API_URL}/invoices/${endpoint}?${params.toString()}`)
      setInvoices(data.invoices || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Erreur chargement factures:', error)
      // Données de démo
      setInvoices([
        { id: 1, invoice_number: 'INV-20251217-A1B2', order_id: 1, user_name: 'Marie Dupont', user_email: 'marie@example.com', subtotal: 286.94, tax_amount: 43.04, total_amount: 329.98, status: 'paid', is_paid: true, payment_method: 'whatsapp', invoice_date: new Date().toISOString(), due_date: null, paid_at: new Date().toISOString() },
        { id: 2, invoice_number: 'INV-20251216-C3D4', order_id: 2, user_name: 'Sophie Martin', user_email: 'sophie@example.com', subtotal: 165.21, tax_amount: 24.78, total_amount: 189.99, status: 'draft', is_paid: false, payment_method: '', invoice_date: new Date().toISOString(), due_date: null, paid_at: null },
      ])
      setTotal(2)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/invoices/stats`)
      setStats(data)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
      setStats({
        customer_invoices: { total: 12, total_revenue: 4520.50, pending: 3 },
        supplier_invoices: { total: 5, total_expenses: 1200.00, pending: 1 },
        net_profit: 3320.50
      })
    }
  }

  const handleMarkAsPaid = async (invoiceId: number) => {
    try {
      await axios.put(`${API_URL}/invoices/customers/${invoiceId}/pay`, null, {
        params: { payment_method: 'cash' }
      })
      loadInvoices()
      loadStats()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  const downloadInvoice = (orderId: number) => {
    window.open(`${API_URL}/orders/${orderId}/invoice/pdf`, '_blank')
  }

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.user_name && invoice.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (invoice.user_email && invoice.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <AdminPageWrapper>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Factures</h1>
              <p className="text-gray-600 mt-1">Factures clients et fournisseurs</p>
            </div>
            <button
              onClick={() => { loadInvoices(); loadStats(); }}
              className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiRefreshCw className="w-5 h-5" />
              <span>Actualiser</span>
            </button>
          </div>

          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Factures Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.customer_invoices.total}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FiFileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Revenus (payées)</p>
                    <p className="text-2xl font-bold text-green-600">{stats.customer_invoices.total_revenue.toFixed(2)} $</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FiDollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.customer_invoices.pending}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <FiClock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Profit Net</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.net_profit.toFixed(2)} $</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FiCheck className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => { setActiveTab('customers'); setSkip(0); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'customers'
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Factures Clients
            </button>
            <button
              onClick={() => { setActiveTab('suppliers'); setSkip(0); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'suppliers'
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Factures Fournisseurs
            </button>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setSkip(0); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyée</option>
                <option value="paid">Payée</option>
                <option value="overdue">En retard</option>
              </select>
            </div>
          </div>

          {/* Tableau des factures */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des factures...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                Aucune facture trouvée
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                          {invoice.order_id && (
                            <p className="text-xs text-gray-500">Cmd #{invoice.order_id}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{invoice.user_name || '-'}</div>
                            <div className="text-sm text-gray-500">{invoice.user_email || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{invoice.total_amount.toFixed(2)} $ CAD</div>
                          <div className="text-xs text-gray-500">
                            HT: {invoice.subtotal.toFixed(2)} $ | Taxes: {invoice.tax_amount.toFixed(2)} $
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[invoice.status] || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABELS[invoice.status] || invoice.status}
                          </span>
                          {invoice.is_paid && (
                            <p className="text-xs text-green-600 mt-1">
                              Payé le {formatDate(invoice.paid_at)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(invoice.invoice_date)}
                          {invoice.due_date && (
                            <p className="text-xs">Échéance: {formatDate(invoice.due_date)}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {!invoice.is_paid && activeTab === 'customers' && (
                              <button
                                onClick={() => handleMarkAsPaid(invoice.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Marquer comme payée"
                              >
                                <FiCheck className="w-5 h-5" />
                              </button>
                            )}
                            {invoice.order_id && (
                              <button
                                onClick={() => downloadInvoice(invoice.order_id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Télécharger PDF"
                              >
                                <FiDownload className="w-5 h-5" />
                              </button>
                            )}
                          </div>
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
    </AdminPageWrapper>
  )
}
