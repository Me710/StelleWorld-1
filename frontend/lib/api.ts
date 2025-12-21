// API Configuration - Utilise le proxy Next.js rewrites
const API_BASE_URL = ''

// Types
export interface FeaturedProduct {
  id: number
  name: string
  short_description?: string
  slug: string
  price: number
  compare_at_price?: number
  discount_percentage?: number
  main_image_url?: string
  is_in_stock: boolean
  sales_count: number
}

export interface FeaturedProductsResponse {
  featured_products: FeaturedProduct[]
}

// API Functions

/**
 * Récupère les produits en vedette depuis l'API
 */
export async function getFeaturedProducts(limit: number = 8): Promise<FeaturedProductsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/featured?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des produits en vedette:', error)
    throw error
  }
}

/**
 * Récupère tous les produits avec filtres optionnels
 */
export async function getProducts(params?: {
  category?: string
  category_id?: number
  search?: string
  min_price?: number
  max_price?: number
  in_stock_only?: boolean
  on_sale_only?: boolean
  featured_only?: boolean
  sort_by?: 'created_at' | 'name' | 'price' | 'sales_count'
  sort_order?: 'asc' | 'desc'
  skip?: number
  limit?: number
}) {
  try {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.append('category', params.category)
    if (params?.category_id) searchParams.append('category_id', params.category_id.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.min_price) searchParams.append('min_price', params.min_price.toString())
    if (params?.max_price) searchParams.append('max_price', params.max_price.toString())
    if (params?.in_stock_only) searchParams.append('in_stock_only', 'true')
    if (params?.on_sale_only) searchParams.append('on_sale_only', 'true')
    if (params?.featured_only) searchParams.append('featured_only', 'true')
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by)
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order)
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const response = await fetch(`${API_BASE_URL}/api/products/?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    throw error
  }
}

/**
 * Récupère un produit par son slug
 */
export async function getProductBySlug(slug: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/slug/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error)
    throw error
  }
}

/**
 * Récupère les catégories
 */
export async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error)
    throw error
  }
}

/**
 * Récupère une catégorie par son slug
 */
export async function getCategory(slug: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/categories/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error)
    throw error
  }
}

/**
 * Récupère les slides du hero slider
 */
export async function getHeroSlides() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hero/slides`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des slides:', error)
    throw error
  }
}

// Cart Item type pour WhatsApp
interface CartItemForWhatsApp {
  name: string
  quantity: number
  price: number
}

/**
 * Génère un lien WhatsApp pour passer commande avec le contenu du panier
 */
export function getWhatsAppCartLink(cart: CartItemForWhatsApp[]): string {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '') || ''

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const itemsList = cart
    .map((item) => `• ${item.name} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)} $ CAD`)
    .join('\n')

  const message = `🛒 *Nouvelle commande StelleWorld*\n\n${itemsList}\n\n💰 *Total: ${total.toFixed(2)} $ CAD*\n\nBonjour, je souhaite passer cette commande. Merci !`

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
}

/**
 * Génère un lien WhatsApp pour contacter le support
 */
export function getWhatsAppContactLink(message?: string): string {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '') || ''
  const defaultMessage = message || 'Bonjour ! J\'aimerais avoir plus d\'informations sur vos produits.'

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`
}

