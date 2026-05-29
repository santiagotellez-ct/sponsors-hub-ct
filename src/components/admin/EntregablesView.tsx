'use client'

import React, { useEffect, useState, useMemo } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type FormField = { label: string; fieldKey: string; type: string }

type DeliverableMeta = {
  itemName: string
  benefitCategory: string
  type: string
  formFields: FormField[]
}

type Row = { sponsorId: string | number; sponsorName: string; deliv: any }

// ─── Main Component ──────────────────────────────────────────────────────────

export const EntregablesView: React.FC = () => {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState('')

  useEffect(() => {
    fetch('/api/sponsors?limit=200&depth=2', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setSponsors(d.docs || []))
      .finally(() => setLoading(false))
  }, [])

  // ─── Unique deliverables across all active participations ─────────────────
  const deliverables = useMemo<DeliverableMeta[]>(() => {
    const map = new Map<string, DeliverableMeta>()
    for (const s of sponsors) {
      const part = s.eventParticipations?.find((p: any) => p.isCurrent)
      for (const d of part?.deliverables || []) {
        const key = `${d.itemName}|||${d.benefitCategory}`
        if (!map.has(key)) {
          const formFields: FormField[] =
            d.type === 'formulario' && typeof d.formId === 'object' && d.formId?.fields
              ? d.formId.fields
              : []
          map.set(key, {
            itemName: d.itemName,
            benefitCategory: d.benefitCategory || '',
            type: d.type || 'text',
            formFields,
          })
        }
      }
    }
    return Array.from(map.values())
  }, [sponsors])

  // Auto-select first deliverable
  useEffect(() => {
    if (deliverables.length > 0 && !selectedKey) {
      setSelectedKey(`${deliverables[0].itemName}|||${deliverables[0].benefitCategory}`)
    }
  }, [deliverables, selectedKey])

  const current = deliverables.find(
    (d) => `${d.itemName}|||${d.benefitCategory}` === selectedKey,
  )

  // ─── One row per sponsor ─────────────────────────────────────────────────
  const rows = useMemo<Row[]>(() => {
    if (!current) return []
    return sponsors.map((s) => {
      const part = s.eventParticipations?.find((p: any) => p.isCurrent)
      const deliv =
        part?.deliverables?.find(
          (d: any) =>
            d.itemName === current.itemName && d.benefitCategory === current.benefitCategory,
        ) ?? null
      return { sponsorId: s.id, sponsorName: s.companyName, deliv }
    })
  }, [sponsors, current])

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: 'var(--theme-text)' }}>Cargando entregables…</div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>
          Entregables
        </h1>
        <p style={{ marginTop: '0.375rem', fontSize: '0.875rem', color: 'var(--theme-elevation-500)' }}>
          Vista consolidada de todos los sponsors activos. Selecciona un entregable para ver las
          respuestas.
        </p>
      </div>

      {deliverables.length === 0 ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem' }}>
          No hay entregables en participaciones activas.
        </p>
      ) : (
        <>
          {/* Pill selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {deliverables.map((d) => {
              const key = `${d.itemName}|||${d.benefitCategory}`
              const active = selectedKey === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    border: `1px solid ${active ? 'var(--theme-text)' : 'var(--theme-elevation-200)'}`,
                    background: active ? 'var(--theme-text)' : 'transparent',
                    color: active ? 'var(--theme-bg)' : 'var(--theme-text)',
                    fontSize: '0.8125rem',
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.12s',
                  }}
                >
                  <TypeDot type={d.type} />
                  {d.itemName}
                  {d.benefitCategory && (
                    <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>· {d.benefitCategory}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Table */}
          {current && (
            <div
              style={{
                overflowX: 'auto',
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: '6px',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                  minWidth: '480px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--theme-elevation-50)',
                      borderBottom: '2px solid var(--theme-elevation-150)',
                    }}
                  >
                    <th style={thStyle}>Sponsor</th>
                    {current.type === 'formulario' && current.formFields.length > 0 ? (
                      current.formFields.map((f) => (
                        <th key={f.fieldKey} style={thStyle}>
                          {f.label}
                        </th>
                      ))
                    ) : (
                      <th style={thStyle}>Respuesta</th>
                    )}
                    <th style={{ ...thStyle, width: '120px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ sponsorId, sponsorName, deliv }, idx) => (
                    <tr
                      key={String(sponsorId)}
                      style={{
                        borderBottom:
                          idx < rows.length - 1
                            ? '1px solid var(--theme-elevation-100)'
                            : 'none',
                        background:
                          idx % 2 !== 0 ? 'var(--theme-elevation-50)' : 'transparent',
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        <a
                          href={`/admin/collections/sponsors/${sponsorId}`}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {sponsorName}
                        </a>
                      </td>

                      {current.type === 'formulario' && current.formFields.length > 0 ? (
                        current.formFields.map((f) => (
                          <td key={f.fieldKey} style={tdStyle}>
                            {deliv?.formResponse != null
                              ? renderFormValue(deliv.formResponse[f.fieldKey], f.type)
                              : empty}
                          </td>
                        ))
                      ) : (
                        <td style={tdStyle}>{renderResponse(deliv, current.type)}</td>
                      )}

                      <td style={tdStyle}>
                        <StatusBadge status={deliv?.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '0.625rem 1rem',
  textAlign: 'left',
  fontSize: '0.6875rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--theme-elevation-500)',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '0.625rem 1rem',
  verticalAlign: 'middle',
  color: 'var(--theme-text)',
}

// ─── Micro components ─────────────────────────────────────────────────────────

const empty = <span style={{ color: 'var(--theme-elevation-300)', fontSize: '0.875rem' }}>—</span>

function TypeDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    image: '#6366f1',
    document: '#f59e0b',
    text: '#10b981',
    link: '#3b82f6',
    formulario: '#8b5cf6',
    direct: '#ec4899',
    action_link: '#f97316',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: colors[type] || '#9ca3af',
        flexShrink: 0,
      }}
    />
  )
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    completed: { label: 'Completado', bg: '#d1fae5', color: '#065f46' },
    pending: { label: 'Pendiente', bg: '#fef3c7', color: '#92400e' },
    overdue: { label: 'Vencido', bg: '#fee2e2', color: '#991b1b' },
  }
  const cfg = map[status ?? ''] ?? {
    label: '—',
    bg: 'var(--theme-elevation-100)',
    color: 'var(--theme-elevation-500)',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Response renderers ───────────────────────────────────────────────────────

function renderResponse(deliv: any, type: string): React.ReactNode {
  if (!deliv) return empty
  switch (type) {
    case 'image':
    case 'document': {
      const file = deliv.uploadedFile
      if (!file) return empty
      const url = typeof file === 'object' ? file.url : null
      if (!url) return empty
      if (type === 'image') {
        return (
          <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
            <img
              src={url}
              alt=""
              style={{ height: '36px', objectFit: 'contain', borderRadius: '3px', display: 'block' }}
            />
          </a>
        )
      }
      const filename = typeof file === 'object' ? (file.filename || 'Archivo') : 'Archivo'
      return (
        <a href={url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.8125rem', textDecoration: 'none' }}>
          {filename}
        </a>
      )
    }
    case 'text':
      return deliv.uploadedText ? (
        <span
          style={{ display: 'block', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}
          title={deliv.uploadedText}
        >
          {deliv.uploadedText}
        </span>
      ) : empty
    case 'link':
      return deliv.uploadedLink ? (
        <a href={deliv.uploadedLink} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.8125rem', wordBreak: 'break-all' }}>
          {deliv.uploadedLink}
        </a>
      ) : empty
    case 'action_link':
    case 'direct':
      return deliv.actionUrl ? (
        <a href={deliv.actionUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.8125rem' }}>
          {deliv.actionUrl}
        </a>
      ) : empty
    default:
      return empty
  }
}

function renderFormValue(value: any, type: string): React.ReactNode {
  if (value === undefined || value === null || value === '') return empty
  switch (type) {
    case 'image': {
      // Stored as { id, url } object (uploaded via /api/media)
      const url = typeof value === 'object' ? value.url : value
      if (!url) return empty
      return (
        <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
          <img src={url} alt="" style={{ height: '36px', objectFit: 'contain', borderRadius: '3px', display: 'block' }} />
        </a>
      )
    }
    case 'link':
      return (
        <a href={value} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.8125rem', wordBreak: 'break-all' }}>
          {value}
        </a>
      )
    case 'email':
      return (
        <a href={`mailto:${value}`} style={{ color: '#3b82f6', fontSize: '0.8125rem' }}>
          {value}
        </a>
      )
    case 'checkbox':
      return <span style={{ fontSize: '1rem' }}>{value ? '✓' : '✗'}</span>
    case 'date':
      try {
        return <span style={{ fontSize: '0.8125rem' }}>{new Date(value).toLocaleDateString('es-CO')}</span>
      } catch {
        return <span style={{ fontSize: '0.8125rem' }}>{String(value)}</span>
      }
    default:
      return (
        <span
          style={{ display: 'block', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}
          title={String(value)}
        >
          {String(value)}
        </span>
      )
  }
}
