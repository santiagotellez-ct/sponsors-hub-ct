import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata = {
  description: 'Sponsors Hub - Plataforma de gestión de patrocinadores',
  title: 'Sponsors Hub',
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
