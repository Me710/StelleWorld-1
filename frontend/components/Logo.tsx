'use client'

interface LogoProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: { width: 120, height: 45 },
    md: { width: 160, height: 60 },
    lg: { width: 220, height: 85 },
  }
  
  const dimensions = sizeClasses[size]
  const logoSrc = variant === 'dark' ? '/images/logo.png' : '/images/logo-white.png'

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt="La Maison"
      width={dimensions.width}
      height={dimensions.height}
      style={{ objectFit: 'contain' }}
    />
  )
}
