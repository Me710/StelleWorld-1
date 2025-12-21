'use client'

import { useState, useEffect } from 'react'
import { FiChevronDown, FiChevronUp, FiMessageCircle } from 'react-icons/fi'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface FAQ {
  id: number
  question: string
  answer: string
  sort_order: number
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    loadFAQs()
  }, [])

  const loadFAQs = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/faq/`)
      setFaqs(data.faqs || [])
      // Ouvrir la première FAQ par défaut
      if (data.faqs && data.faqs.length > 0) {
        setOpenId(data.faqs[0].id)
      }
    } catch (error) {
      console.error('Erreur chargement FAQ:', error)
      // FAQ par défaut en cas d'erreur API
      setFaqs([
        {
          id: 1,
          question: "En combien de temps pourrais-je recevoir la commande ?",
          answer: "Les livraisons se font tous les matins entre 7h-10h",
          sort_order: 0
        },
        {
          id: 2,
          question: "Combien coûte la livraison ?",
          answer: "5$ pour Sainte-Foy et ses environs au frais du client.",
          sort_order: 1
        },
        {
          id: 3,
          question: "Est-ce qu'on peut se faire rembourser ?",
          answer: "Nous vous garantissons d'échanger vos produits achetés chez nous, mais à la seule condition qu'il soit dans son état originelle. Nous sommes désolés mais nous ne remboursons pas.",
          sort_order: 2
        },
        {
          id: 4,
          question: "Vous livrez en dehors du Québec ?",
          answer: "Absolument ! Les frais de livraison sont au frais du client.",
          sort_order: 3
        }
      ])
      setOpenId(1)
    } finally {
      setLoading(false)
    }
  }

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
            <div className="space-y-3 mt-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
            <FiMessageCircle className="w-8 h-8 text-pink-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Foire aux questions
          </h1>
          <p className="text-xl text-gray-600">
            Trouvez les réponses aux questions les plus fréquentes
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                {openId === faq.id ? (
                  <FiChevronUp className="w-5 h-5 text-pink-600 flex-shrink-0" />
                ) : (
                  <FiChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {openId === faq.id && (
                <div className="px-6 pb-5 border-t border-gray-100">
                  <p className="text-gray-600 pt-4 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            Vous n'avez pas trouvé la réponse ?
          </h2>
          <p className="text-pink-100 mb-6">
            Contactez-nous directement sur WhatsApp pour une réponse rapide
          </p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-white text-pink-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            <span>Contactez-nous</span>
          </a>
        </div>
      </div>
    </div>
  )
}

