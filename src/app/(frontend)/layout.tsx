import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata = {
  title: 'Sponsor Hub',
  description: 'Sponsor Hub - Plataforma de gestión de patrocinadores',
  // Configuración para WhatsApp, Facebook, LinkedIn, etc.
  openGraph: {
    title: 'Sponsor Hub',
    description: 'Sponsor Hub - Plataforma de gestión de patrocinadores',
    type: 'website',
    images: [
      {
        url: '/favicon.ico', // Apunta a tu archivo en la carpeta public
        width: 256, // Tamaño sugerido para favicons/logos cuadrados
        height: 256,
        alt: 'Sponsor Hub Logo',
      },
    ],
  },
  // Configuración específica para Twitter/X
  twitter: {
    card: 'summary', // 'summary' es mejor para imágenes cuadradas como favicons
    title: 'Sponsor Hub',
    description: 'Sponsor Hub - Plataforma de gestión de patrocinadores',
    images: ['/favicon.ico'],
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <main>{children}</main>
      </body>
    </html>
  )
}
