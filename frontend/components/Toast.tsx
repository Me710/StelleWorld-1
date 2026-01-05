'use client'

import { useEffect } from 'react'
import { FiCheck, FiAlertCircle, FiX, FiInfo } from 'react-icons/fi'

export interface ToastProps {
    message: string
    type: 'success' | 'error' | 'info'
    onClose: () => void
    duration?: number
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [onClose, duration])

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    }[type]

    const Icon = {
        success: FiCheck,
        error: FiAlertCircle,
        info: FiInfo
    }[type]

    return (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${bgColor} animate-slide-in`}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="max-w-md">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-80 flex-shrink-0">
                <FiX className="w-4 h-4" />
            </button>
        </div>
    )
}

// Hook pour utiliser le toast plus facilement
import { useState, useCallback } from 'react'

export function useToast() {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type })
    }, [])

    const hideToast = useCallback(() => {
        setToast(null)
    }, [])

    return { toast, showToast, hideToast }
}

// Helper pour obtenir les headers d'authentification
export const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
}

