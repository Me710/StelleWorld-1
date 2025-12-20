'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

interface User {
  id: number
  email: string
  full_name: string
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      try {
        const { data } = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data.is_admin) {
          setUser(data)
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
          localStorage.removeItem('admin_token')
        }
      } catch {
        localStorage.removeItem('admin_token')
      }
    }
    setIsLoading(false)
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      const { data } = await axios.post(`${API_URL}/auth/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })

      if (data.access_token) {
        // Vérifier si l'utilisateur est admin
        const userRes = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` }
        })

        if (userRes.data.is_admin) {
          localStorage.setItem('admin_token', data.access_token)
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
          setUser(userRes.data)
          return true
        } else {
          return false
        }
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/admin/login')
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
