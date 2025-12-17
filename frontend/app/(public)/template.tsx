import PromoBanner from '@/components/PromoBanner'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PromoBanner />
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
