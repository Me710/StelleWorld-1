/** @type {import('next').NextConfig} */

// URL du backend API - utilise la variable d'environnement en production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

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
    // En production (Render), les appels API vont directement au backend
    // En développement, on proxie vers localhost
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${API_URL}/api/:path*`,
        },
      ]
    }
    // Développement local
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8001/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
