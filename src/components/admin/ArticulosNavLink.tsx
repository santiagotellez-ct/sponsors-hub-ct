'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export const ArticulosNavLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname?.startsWith('/admin/articulos')

  return (
    <div style={{ padding: '0 8px', marginTop: '2px' }}>
      <a
        href="/admin/articulos"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          borderRadius: '4px',
          textDecoration: 'none',
          fontSize: '0.875rem',
          color: 'var(--theme-text)',
          background: isActive ? 'var(--theme-elevation-150)' : 'transparent',
          fontWeight: isActive ? 600 : 400,
          transition: 'background 0.1s',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.65, flexShrink: 0 }}
        >
          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
          <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
        Artículos
      </a>
    </div>
  )
}
