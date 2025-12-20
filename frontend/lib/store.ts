import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface CartItem {
  id: number
  name: string
  slug: string
  price: number
  quantity: number
  image: string
  stock: number
}

interface CartState {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

// Cart Store avec persistance localStorage
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (item) => {
        set((state) => {
          const existingItem = state.cart.find((i) => i.id === item.id)
          
          if (existingItem) {
            // Mise à jour de la quantité si le produit existe déjà
            const newQuantity = Math.min(
              existingItem.quantity + (item.quantity || 1),
              item.stock
            )
            return {
              cart: state.cart.map((i) =>
                i.id === item.id ? { ...i, quantity: newQuantity } : i
              ),
            }
          }
          
          // Ajout d'un nouveau produit
          return {
            cart: [...state.cart, { ...item, quantity: item.quantity || 1 }],
          }
        })
      },

      removeFromCart: (id) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        }))
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              cart: state.cart.filter((item) => item.id !== id),
            }
          }
          
          return {
            cart: state.cart.map((item) =>
              item.id === id
                ? { ...item, quantity: Math.min(quantity, item.stock) }
                : item
            ),
          }
        })
      },

      clearCart: () => {
        set({ cart: [] })
      },

      getTotalItems: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().cart.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },
    }),
    {
      name: 'stelleworld-cart', // Nom dans localStorage
    }
  )
)

