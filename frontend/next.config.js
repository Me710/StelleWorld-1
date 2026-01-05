/** @type {import('next').NextConfig} */

// URL du backend API - utilise la variable d'environnement en production
// Note: NEXT_PUBLIC_API_URL doit être l'URL de BASE sans /api (ex: https://stelleworld-api.onrender.com)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') // Enlève /api s'il existe
  : 'http://localhost:8001'

const nextConfig = {
  reactStrictMode: true,
  images: {
    // remotePatterns remplace domains (deprecated)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Désactiver l'optimisation pour les images externes problématiques
    unoptimized: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+15813081802',
  },
  async rewrites() {
    // Proxy les appels /api/* vers le backend
    // Fonctionne en développement (localhost) et production (Render)
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
