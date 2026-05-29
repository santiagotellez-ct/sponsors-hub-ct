'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export const EntregablesNavLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname?.startsWith('/admin/entregables')

  return (
    <div style={{ padding: '0 8px', marginTop: '2px' }}>
      <a
        href="/admin/entregables"
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
        {/* Clipboard list icon */}
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
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
        Entregables
      </a>
    </div>
  )
}
