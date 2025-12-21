import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import WhatsAppButton from '@/components/WhatsAppButton'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PromoBanner from '@/components/PromoBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'La Maison - Votre boutique beauté',
  description: 'Découvrez notre sélection de mèches, soins et services beauté',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
