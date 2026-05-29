'use client'

import React, { useEffect, useState, useMemo } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type FormField = { label: string; fieldKey: string; type: string }

type DeliverableMeta = {
  key: string
  itemName: string
  benefitCategory: string
  type: string
  formFields: FormField[]
}

type Row = { sponsorId: string | number; sponsorName: string; deliv: any }

type PlanOption = { id: string; name: string; sponsorCount: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise a plan field that may be a populated object or a raw ID */
function normalizePlan(plan: any): { id: string; name: string } | null {
  if (!plan) return null
  if (typeof plan === 'object') return { id: String(plan.id), name: plan.name || String(plan.id) }
  return { id: String(plan), name: String(plan) }
}

/** Return the active participation of a sponsor, or null */
function activePart(sponsor: any) {
  return sponsor.eventParticipations?.find((p: any) => p.isCurrent) ?? null
}

// ─── Accordion Item ──────────────────────────────────────────────────────────

function DeliverableAccordionItem({ meta, rows }: { meta: DeliverableMeta; rows: Row[] }) {
  const [open, setOpen] = useState(false)
  const completedCount = rows.filter((r) => r.deliv?.status === 'completed').length

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: open ? 'var(--theme-elevation-50)' : 'transparent',
          border: 'none',
          borderBottom: open ? '1px solid var(--theme-elevation-150)' : 'none',
          cursor: 'pointer',
          color: 'var(--theme-text)',
          textAlign: 'left',
        }}
      >
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            opacity: 0.45,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          <polyline points="4,2 8,6 4,10" />
        </svg>

        {/* Name */}
        <span style={{ fontWeight: 500, fontSize: '0.9375rem', flex: 1, textAlign: 'left' }}>
          {meta.itemName}
          {meta.benefitCategory && (
            <span style={{ fontWeight: 400, opacity: 0.4, fontSize: '0.8125rem', marginLeft: '0.5rem' }}>
              · {meta.benefitCategory}
            </span>
          )}
        </span>

        <TypeBadge type={meta.type} />

        {/* Progress */}
        <span style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-500)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
          {completedCount}
          <span style={{ opacity: 0.5 }}>/{rows.length}</span>
        </span>
      </button>

      {/* Expanded table */}
      {open && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '400px' }}>
            <thead>
              <tr style={{ background: 'var(--theme-elevation-50)', borderBottom: '1px solid var(--theme-elevation-150)' }}>
                <th style={thStyle}>Sponsor</th>
                {meta.type === 'formulario' && meta.formFields.length > 0
                  ? meta.formFields.map((f) => <th key={f.fieldKey} style={thStyle}>{f.label}</th>)
                  : <th style={thStyle}>Respuesta</th>}
                <th style={{ ...thStyle, width: '120px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ sponsorId, sponsorName, deliv }, idx) => (
                <tr
                  key={String(sponsorId)}
                  style={{
                    borderBottom: idx < rows.length - 1 ? '1px solid var(--theme-elevation-100)' : 'none',
                    background: idx % 2 !== 0 ? 'var(--theme-elevation-50)' : 'transparent',
                  }}
                >
                  <td style={{ ...tdStyle, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    <a href={`/admin/collections/sponsors/${sponsorId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {sponsorName}
                    </a>
                  </td>

                  {meta.type === 'formulario' && meta.formFields.length > 0
                    ? meta.formFields.map((f) => (
                        <td key={f.fieldKey} style={tdStyle}>
                          {deliv?.formResponse != null ? renderFormValue(deliv.formResponse[f.fieldKey], f.type) : empty}
                        </td>
                      ))
                    : <td style={tdStyle}>{renderResponse(deliv, meta.type)}</td>}

                  <td style={tdStyle}><StatusBadge status={deliv?.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export const EntregablesViewClient: React.FC = () => {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all')

  useEffect(() => {
    fetch('/api/sponsors?limit=200&depth=2', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setSponsors(d.docs || []))
      .finally(() => setLoading(false))
  }, [])

  // ─── Derive unique plans from loaded sponsors ─────────────────────────────
  const availablePlans = useMemo<PlanOption[]>(() => {
    const map = new Map<string, PlanOption>()
    for (const s of sponsors) {
      const part = activePart(s)
      const plan = normalizePlan(part?.plan)
      if (!plan) continue
      if (!map.has(plan.id)) {
        map.set(plan.id, { id: plan.id, name: plan.name, sponsorCount: 0 })
      }
      map.get(plan.id)!.sponsorCount++
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [sponsors])

  // ─── Filter sponsors by selected plan ────────────────────────────────────
  const filteredSponsors = useMemo(() => {
    if (selectedPlanId === 'all') return sponsors
    return sponsors.filter((s) => {
      const part = activePart(s)
      const plan = normalizePlan(part?.plan)
      return plan?.id === selectedPlanId
    })
  }, [sponsors, selectedPlanId])

  // ─── Derive unique deliverables from filtered sponsors only ───────────────
  const deliverables = useMemo<DeliverableMeta[]>(() => {
    const map = new Map<string, DeliverableMeta>()
    for (const s of filteredSponsors) {
      const part = activePart(s)
      for (const d of part?.deliverables || []) {
        const key = `${d.itemName}|||${d.benefitCategory}`
        if (!map.has(key)) {
          const formFields: FormField[] =
            d.type === 'formulario' && typeof d.formId === 'object' && d.formId?.fields
              ? d.formId.fields
              : []
          map.set(key, {
            key,
            itemName: d.itemName,
            benefitCategory: d.benefitCategory || '',
            type: d.type || 'text',
            formFields,
          })
        }
      }
    }
    return Array.from(map.values())
  }, [filteredSponsors])

  // ─── One row per filtered sponsor, per deliverable ────────────────────────
  const rowsMap = useMemo(() => {
    const map = new Map<string, Row[]>()
    for (const meta of deliverables) {
      map.set(
        meta.key,
        filteredSponsors.map((s) => {
          const part = activePart(s)
          const deliv =
            part?.deliverables?.find(
              (d: any) => d.itemName === meta.itemName && d.benefitCategory === meta.benefitCategory,
            ) ?? null
          return { sponsorId: s.id, sponsorName: s.companyName, deliv }
        }),
      )
    }
    return map
  }, [filteredSponsors, deliverables])

  // ─── Reset plan selection if it disappears (e.g. all sponsors removed) ───
  useEffect(() => {
    if (selectedPlanId !== 'all' && !availablePlans.find((p) => p.id === selectedPlanId)) {
      setSelectedPlanId('all')
    }
  }, [availablePlans, selectedPlanId])

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>
          Entregables
        </h1>
        <p style={{ marginTop: '0.375rem', fontSize: '0.875rem', color: 'var(--theme-elevation-500)' }}>
          Selecciona un plan y luego el entregable para ver las respuestas de cada sponsor.
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem' }}>Cargando…</p>
      ) : (
        <>
          {/* Plan filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--theme-elevation-800)', whiteSpace: 'nowrap' }}>
              Plan:
            </span>

            {/* "All" pill */}
            <PlanPill
              label="Todos los planes"
              count={sponsors.filter((s) => !!activePart(s)).length}
              active={selectedPlanId === 'all'}
              onClick={() => setSelectedPlanId('all')}
            />

            {availablePlans.map((plan) => (
              <PlanPill
                key={plan.id}
                label={plan.name}
                count={plan.sponsorCount}
                active={selectedPlanId === plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </div>

          {/* Summary line */}
          {filteredSponsors.length > 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-500)', marginBottom: '1rem' }}>
              {filteredSponsors.length} sponsor{filteredSponsors.length !== 1 ? 's' : ''} ·{' '}
              {deliverables.length} entregable{deliverables.length !== 1 ? 's' : ''}
            </p>
          )}

          {/* Accordion */}
          {deliverables.length === 0 ? (
            <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem' }}>
              {filteredSponsors.length === 0
                ? 'No hay sponsors en este plan.'
                : 'No hay entregables registrados para este plan.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {deliverables.map((meta) => (
                <DeliverableAccordionItem
                  key={meta.key}
                  meta={meta}
                  rows={rowsMap.get(meta.key) || []}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Plan pill button ─────────────────────────────────────────────────────────

function PlanPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '9999px',
        border: `1px solid ${active ? 'var(--theme-text)' : 'var(--theme-elevation-200)'}`,
        background: active ? 'var(--theme-text)' : 'transparent',
        color: active ? 'var(--theme-bg)' : 'var(--theme-text)',
        fontSize: '0.8125rem',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          padding: '0.05rem 0.35rem',
          borderRadius: '9999px',
          background: active ? 'rgba(255,255,255,0.2)' : 'var(--theme-elevation-100)',
          color: active ? 'inherit' : 'var(--theme-elevation-600)',
        }}
      >
        {count}
      </span>
    </button>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
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

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  image:       { label: 'Imagen',     color: '#6366f1' },
  document:    { label: 'Documento',  color: '#f59e0b' },
  text:        { label: 'Texto',      color: '#10b981' },
  link:        { label: 'Link',       color: '#3b82f6' },
  formulario:  { label: 'Formulario', color: '#8b5cf6' },
  direct:      { label: 'Directo',    color: '#ec4899' },
  action_link: { label: 'Acción',     color: '#f97316' },
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_LABELS[type] ?? { label: type, color: '#9ca3af' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.6875rem',
        fontWeight: 600,
        background: `${cfg.color}22`,
        color: cfg.color,
        border: `1px solid ${cfg.color}44`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    completed: { label: 'Completado', bg: '#d1fae5', color: '#065f46' },
    pending:   { label: 'Pendiente',  bg: '#fef3c7', color: '#92400e' },
    overdue:   { label: 'Vencido',    bg: '#fee2e2', color: '#991b1b' },
  }
  const cfg = map[status ?? ''] ?? { label: '—', bg: 'var(--theme-elevation-100)', color: 'var(--theme-elevation-500)' }
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
            <img src={url} alt="" style={{ height: '36px', objectFit: 'contain', borderRadius: '3px', display: 'block' }} />
          </a>
        )
      }
      const filename = typeof file === 'object' ? file.filename || 'Archivo' : 'Archivo'
      return <a href={url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.8125rem' }}>{filename}</a>
    }
    case 'text':
      return deliv.uploadedText ? (
        <span style={{ display: 'block', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem' }} title={deliv.uploadedText}>
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
      const url = typeof value === 'object' ? value.url : value
      if (!url) return empty
      return (
        <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
          <img src={url} alt="" style={{ height: '36px', objectFit: 'contain', borderRadius: '3px', display: 'block' }} />
        </a>
      )
    }
    case 'link':
      return <a href={value} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.8125rem', wordBreak: 'break-all' }}>{value}</a>
    case 'email':
      return <a href={`mailto:${value}`} style={{ color: '#3b82f6', fontSize: '0.8125rem' }}>{value}</a>
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
        <span style={{ display: 'block', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem' }} title={String(value)}>
          {String(value)}
        </span>
      )
  }
}
