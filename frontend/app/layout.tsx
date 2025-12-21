import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import WhatsAppButton from '@/components/WhatsAppButton'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PromoBanner from '@/components/PromoBanner'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

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
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
