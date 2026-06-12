'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export const CSDashboardNavLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname?.startsWith('/admin/cs-dashboard')

  return (
    <div style={{ padding: '0 8px', marginTop: '2px' }}>
      <a
        href="/admin/cs-dashboard"
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
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        CS Dashboard
      </a>
    </div>
  )
}
