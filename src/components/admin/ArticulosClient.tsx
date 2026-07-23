'use client'

import React, { useEffect, useMemo, useState } from 'react'

const TIER_COLORS: Record<string, string> = {
  Diamond: '#b9f2ff',
  Platinum: '#e5e4e2',
  Gold: '#ffd700',
  Silver: '#c0c0c0',
  Bronze: '#cd7f32',
  Aliados: '#e2e8f0',
  Experiencia: '#e2e8f0',
  Presenta: '#e2e8f0',
  'Media Partner': '#e2e8f0',
}

type ArticleStatus = 'none' | 'draft' | 'published'

const STATUS_CFG: Record<ArticleStatus, { label: string; bg: string; color: string; dot: string }> = {
  none: { label: 'Sin artículo', bg: 'var(--theme-elevation-100)', color: 'var(--theme-elevation-500)', dot: 'var(--theme-elevation-300)' },
  draft: { label: 'Borrador', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  published: { label: 'Publicado', bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
}

function toId(val: any) {
  return val && typeof val === 'object' ? val.id : val
}

function initials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function ArticuloEditor({ sponsor, onBack }: { sponsor: any; onBack: () => void }) {
  return (
    <div style={{ padding: '1.75rem 2rem' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0.4rem 0.875rem',
          background: 'transparent',
          color: 'var(--theme-text)',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '6px',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '1.5rem',
          fontFamily: 'inherit',
        }}
      >
        ← Volver
      </button>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--theme-text)', margin: '0 0 0.5rem' }}>
        {sponsor.companyName || 'Sin nombre'}
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--theme-elevation-500)', margin: 0 }}>Editor próximamente</p>
    </div>
  )
}

function SponsorCard({
  sponsor,
  status,
  onClick,
}: {
  sponsor: any
  status: ArticleStatus
  onClick: () => void
}) {
  const logoUrl = sponsor.logo && typeof sponsor.logo === 'object' ? sponsor.logo.url : null
  const tierColor = sponsor.tier ? TIER_COLORS[sponsor.tier] : null
  const cfg = STATUS_CFG[status]

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1.25rem 1rem',
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '10px',
        cursor: 'pointer',
        textAlign: 'center',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-elevation-300)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-elevation-150)'
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={sponsor.companyName || ''}
          style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px', background: 'var(--theme-bg)' }}
        />
      ) : (
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '8px',
            background: 'var(--theme-elevation-150)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--theme-elevation-500)',
          }}
        >
          {initials(sponsor.companyName)}
        </div>
      )}

      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--theme-text)', lineHeight: 1.3 }}>
        {sponsor.companyName || 'Sin nombre'}
      </span>

      {tierColor && (
        <span
          style={{
            display: 'inline-block',
            padding: '0.2rem 0.7rem',
            borderRadius: '99px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            background: tierColor,
            color: '#1f2937',
          }}
        >
          {sponsor.tier}
        </span>
      )}

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '0.2rem 0.7rem',
          borderRadius: '99px',
          background: cfg.bg,
          color: cfg.color,
          fontSize: '0.6875rem',
          fontWeight: 600,
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot }} />
        {cfg.label}
      </span>
    </button>
  )
}

export const ArticulosClient: React.FC = () => {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/sponsors?limit=300&depth=1', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/sponsor-articles?limit=300&depth=1', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([sponsorsData, articlesData]) => {
        setSponsors(sponsorsData.docs || [])
        setArticles(articlesData.docs || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const articleBySponsor = useMemo(() => {
    const map = new Map<string, any>()
    for (const a of articles) {
      const sId = toId(a.sponsor)
      if (sId != null) map.set(String(sId), a)
    }
    return map
  }, [articles])

  const selectedSponsor = useMemo(
    () => sponsors.find(s => String(s.id) === String(selectedSponsorId)) ?? null,
    [sponsors, selectedSponsorId],
  )

  if (selectedSponsor) {
    return <ArticuloEditor sponsor={selectedSponsor} onBack={() => setSelectedSponsorId(null)} />
  }

  return (
    <div style={{ padding: '1.75rem 2rem', minHeight: '100%' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>Artículos</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--theme-elevation-500)', margin: '0.25rem 0 0' }}>
          Onepagers por sponsor — selecciona una cuenta para editar su artículo
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', padding: '2rem 0' }}>Cargando sponsors…</p>
      ) : sponsors.length === 0 ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', padding: '2rem 0' }}>No hay sponsors registrados.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {sponsors.map(sponsor => {
            const article = articleBySponsor.get(String(sponsor.id))
            const status: ArticleStatus = article ? (article.status === 'published' ? 'published' : 'draft') : 'none'
            return (
              <SponsorCard
                key={String(sponsor.id)}
                sponsor={sponsor}
                status={status}
                onClick={() => setSelectedSponsorId(sponsor.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
