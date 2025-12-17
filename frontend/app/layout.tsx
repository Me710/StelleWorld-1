import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import WhatsAppButton from '@/components/WhatsAppButton'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StelleWorld - Votre boutique beauté',
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
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  )
}
