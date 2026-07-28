'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Filter, SlidersHorizontal } from 'lucide-react'

type DeliverableCol = {
  key: string
  itemName: string
  benefitCategory: string
  type: string
}

type SponsorRow = {
  id: string | number
  name: string
  planName: string
  deliverables: Record<string, any>
  total: number
  completed: number
}

type ModalData =
  | { kind: 'file'; url: string; filename: string; isImage: boolean }
  | { kind: 'form'; sponsorId: string | number; delivKey: string; sponsorName: string; delivName: string; fields: { label: string; value: any; type: string }[]; status: string; dueDate?: string; publishedLink?: string }

function activePart(sponsor: any) {
  return sponsor.eventParticipations?.find((p: any) => p.isCurrent) ?? sponsor.eventParticipations?.[0] ?? null
}

function normalizePlan(plan: any): string {
  if (!plan) return '—'
  if (typeof plan === 'object') return plan.name || String(plan.id)
  return String(plan)
}

function toId(val: any) {
  return val && typeof val === 'object' ? val.id : val
}

function fmtDate(d: any): string {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) }
  catch { return String(d) }
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  completed: { label: '✓ Enviado',   bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  pending:   { label: '○ Pendiente', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  overdue:   { label: '! Vencido',   bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  published: { label: '★ Publicado', bg: '#ede9fe', color: '#4c1d95', dot: '#7c3aed' },
}

function statusCfg(status?: string) {
  return STATUS_CFG[status ?? ''] ?? { label: '—', bg: 'var(--theme-elevation-100)', color: 'var(--theme-elevation-400)', dot: 'var(--theme-elevation-300)' }
}

const TIER_OPTIONS = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Aliados', 'Experiencia', 'Presenta', 'Media Partner']

const COMPLETION_OPTIONS: { val: 'all' | 'none' | 'partial' | 'complete'; label: string }[] = [
  { val: 'all', label: 'Todos' },
  { val: 'none', label: 'Sin iniciar' },
  { val: 'partial', label: 'En progreso' },
  { val: 'complete', label: 'Completos' },
]

const DAY_MS = 24 * 60 * 60 * 1000

function isOverdueDeliv(d: any, todayMs: number) {
  if (!d.dueDate || d.status === 'completed' || d.status === 'published') return false
  return new Date(d.dueDate).getTime() < todayMs
}

function isDueSoonDeliv(d: any, todayMs: number, sevenDaysMs: number) {
  if (!d.dueDate || d.status === 'completed' || d.status === 'published') return false
  const t = new Date(d.dueDate).getTime()
  return t >= todayMs && t <= sevenDaysMs
}

const COLUMN_FILTER_STATUSES: { val: string; label: string }[] = [
  { val: 'completed', label: 'Enviado' },
  { val: 'published', label: 'Publicado' },
  { val: 'pending', label: 'Pendiente' },
  { val: 'overdue', label: 'Vencido' },
]

function Modal({ data, onClose, onSave }: { data: ModalData | null; onClose: () => void; onSave: (sponsorId: string | number, delivKey: string, newStatus: string, newLink: string) => Promise<void> }) {
  const [editStatus, setEditStatus] = useState('')
  const [editLink, setEditLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [data, onClose])

  useEffect(() => {
    if (data?.kind === 'form') {
      setEditStatus(data.status || 'pending')
      setEditLink(data.publishedLink || '')
      setSaveError(null)
    }
  }, [data])

  if (!data) return null

  const handleSave = async () => {
    if (data.kind !== 'form') return
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(data.sponsorId, data.delivKey, editStatus, editLink)
      onClose()
    } catch (err: any) {
      setSaveError(err?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl; a.download = filename; a.click()
      URL.revokeObjectURL(blobUrl)
    } catch { window.open(url, '_blank') }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--theme-bg)', borderRadius: '10px', width: data.kind === 'form' ? 'min(560px, 95vw)' : 'min(720px, 95vw)', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 72px rgba(0,0,0,0.4)', border: '1px solid var(--theme-elevation-150)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--theme-elevation-150)', flexShrink: 0, gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {data.kind === 'form' ? (
              <>
                <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--theme-text)' }}>{data.delivName}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-500)', margin: '2px 0 0' }}>{data.sponsorName}</p>
              </>
            ) : (
              <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0, wordBreak: 'break-all', color: 'var(--theme-text)' }}>{data.filename}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            {data.kind === 'file' && (
              <button type="button" onClick={() => handleDownload(data.url, data.filename)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.875rem', background: 'var(--theme-text)', color: 'var(--theme-bg)', border: 'none', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>↓ Descargar</button>
            )}
            <button type="button" onClick={onClose} style={{ background: 'var(--theme-elevation-150)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'var(--theme-text)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {data.kind === 'file' && data.isImage && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--theme-elevation-50)', padding: '1.5rem' }}>
              <img src={data.url} alt={data.filename} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '4px' }} />
            </div>
          )}
          {data.kind === 'file' && !data.isImage && (
            <iframe src={data.url} title={data.filename} style={{ width: '100%', height: '68vh', border: 'none' }} />
          )}
          {data.kind === 'form' && (
            <div style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                {(() => { const cfg = statusCfg(data.status); return (<span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>) })()}
                {data.dueDate && <span style={{ fontSize: '0.75rem', color: 'var(--theme-elevation-400)', marginLeft: '0.75rem' }}>Fecha límite: {fmtDate(data.dueDate)}</span>}
              </div>
              {data.fields.map((f, i) => (
                <div key={i} style={{ padding: '0.875rem 0', borderBottom: i < data.fields.length - 1 ? '1px solid var(--theme-elevation-100)' : 'none' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--theme-elevation-500)', marginBottom: '4px' }}>{f.label}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--theme-text)', lineHeight: 1.5 }}>
                    {f.value === null || f.value === undefined || f.value === '' ? (
                      <span style={{ color: 'var(--theme-elevation-300)' }}>Sin respuesta</span>
                    ) : f.type === 'link' || f.type === 'email' ? (
                      <a href={f.type === 'email' ? `mailto:${f.value}` : f.value} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>{f.value}</a>
                    ) : String(f.value)}
                  </div>
                </div>
              ))}
              {data.fields.length === 0 && <p style={{ color: 'var(--theme-elevation-400)', fontSize: '0.875rem' }}>No hay respuestas registradas aún.</p>}

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--theme-elevation-150)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--theme-elevation-500)', marginBottom: '4px' }}>Estado</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-200)', borderRadius: '6px', color: 'var(--theme-text)', fontSize: '0.875rem', fontFamily: 'inherit' }}>
                    {Object.entries(STATUS_CFG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--theme-elevation-500)', marginBottom: '4px' }}>Link de publicación</label>
                  <input type="text" value={editLink} onChange={e => setEditLink(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-200)', borderRadius: '6px', color: 'var(--theme-text)', fontSize: '0.875rem', fontFamily: 'inherit' }} />
                </div>
                {saveError && <p style={{ color: '#991b1b', fontSize: '0.8125rem', margin: 0 }}>{saveError}</p>}
                <button type="button" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start', padding: '0.45rem 1rem', background: 'var(--theme-text)', color: 'var(--theme-bg)', border: 'none', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DelivCell({ deliv, colType, sponsorName, colName, sponsorId, delivKey, onOpen }: { deliv: any; colType: string; sponsorName: string; colName: string; sponsorId: string | number; delivKey: string; onOpen: (data: ModalData) => void }) {
  const cfg = statusCfg(deliv?.status)
  if (!deliv) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><span style={{ color: 'var(--theme-elevation-250)', fontSize: '0.875rem' }}>—</span></div>
  }
  const isClickable = deliv.status === 'completed' || deliv.status === 'published'
  const handleClick = () => {
    if (!isClickable) return
    // Archivo subido (imagen, documento o direct con archivo)
    if (deliv.uploadedFile) {
      const file = deliv.uploadedFile
      const url = typeof file === 'object' ? file.url : null
      if (url) {
        const isImg = colType === 'image' || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.filename || '')
        onOpen({ kind: 'file', url, filename: typeof file === 'object' ? (file.filename || 'archivo') : 'archivo', isImage: isImg })
        return
      }
    }
    if (colType === 'text' && deliv.uploadedText) {
      const fields = [{ label: 'Texto enviado', value: deliv.uploadedText, type: 'text' }]
      onOpen({ kind: 'form', sponsorId, delivKey, sponsorName, delivName: colName, status: deliv.status, dueDate: deliv.dueDate, publishedLink: deliv.publishedLink, fields })
      return
    }
    if (deliv.uploadedLink) {
      const fields = [{ label: 'Link enviado', value: deliv.uploadedLink, type: 'link' }]
      onOpen({ kind: 'form', sponsorId, delivKey, sponsorName, delivName: colName, status: deliv.status, dueDate: deliv.dueDate, publishedLink: deliv.publishedLink, fields })
      return
    }
    if (colType === 'formulario') {
      const formId = deliv.formId
      const formFields: { label: string; value: any; type: string }[] = []
      if (typeof formId === 'object' && formId?.fields) {
        for (const f of formId.fields) { formFields.push({ label: f.label, value: deliv.formResponse?.[f.fieldKey] ?? deliv.formResponse?.[f.label] ?? null, type: f.type || 'text' }) }
      } else if (deliv.formResponse && typeof deliv.formResponse === 'object') {
        for (const [k, v] of Object.entries(deliv.formResponse)) { formFields.push({ label: k, value: v, type: 'text' }) }
      }
      onOpen({ kind: 'form', sponsorId, delivKey, sponsorName, delivName: colName, status: deliv.status, dueDate: deliv.dueDate, publishedLink: deliv.publishedLink, fields: formFields }); return
    }
    const url = deliv.actionUrl
    if (url) window.open(url, '_blank')
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '100%', padding: '0 8px' }}>
      <button type="button" onClick={handleClick} disabled={!isClickable} title={isClickable ? `Ver entregable: ${colName}` : cfg.label}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: cfg.bg, color: cfg.color, border: 'none', cursor: isClickable ? 'pointer' : 'default', fontSize: '0.75rem', fontWeight: 600 }}
        onMouseEnter={e => { if (isClickable) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.92)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = '' }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
        {cfg.label}
        {isClickable && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
      </button>
      {deliv.dueDate && !isClickable && <span style={{ fontSize: '0.625rem', color: 'var(--theme-elevation-400)' }}>{fmtDate(deliv.dueDate)}</span>}
    </div>
  )
}

export const CSDashboardClient: React.FC = () => {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalData, setModalData] = useState<ModalData | null>(null)
  const closeModal = useCallback(() => setModalData(null), [])

  // --- Filtros avanzados ---
  const [tierFilter, setTierFilter] = useState<string[]>([])
  const [overdueFilter, setOverdueFilter] = useState<boolean | null>(null)
  const [completionFilter, setCompletionFilter] = useState<'all' | 'none' | 'partial' | 'complete'>('all')
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'unpublished'>('all')
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'due_soon' | 'ok'>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // --- Filtros por columna ---
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [openColumnFilter, setOpenColumnFilter] = useState<string | null>(null)

  useEffect(() => {
    if (!openColumnFilter) return
    const handler = () => setOpenColumnFilter(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openColumnFilter])

  const handleSaveDeliverable = useCallback(async (sponsorId: string | number, delivKey: string, newStatus: string, newLink: string) => {
    const sponsor = sponsors.find(s => String(s.id) === String(sponsorId))
    if (!sponsor) throw new Error('Sponsor no encontrado')
    const participations = sponsor.eventParticipations || []
    const activeIndex = participations.findIndex((p: any) => p.isCurrent)
    const targetIndex = activeIndex >= 0 ? activeIndex : 0

    const updatedParticipations = participations.map((part: any, idx: number) => {
      const normalized = {
        ...part,
        event: toId(part.event),
        plan: toId(part.plan),
        deliverables: (part.deliverables || []).map((d: any) => ({
          ...d,
          formId: toId(d.formId),
          uploadedFile: toId(d.uploadedFile),
        })),
        benefitItems: (part.benefitItems || []).map((item: any) => ({
          ...item,
          evidences: (item.evidences || []).map((ev: any) => ({ ...ev, file: toId(ev.file) })),
        })),
        redesSociales: (part.redesSociales || []).map((r: any) => ({
          ...r,
          pieza: toId(r.pieza),
          archivo: toId(r.archivo),
        })),
      }

      if (idx !== targetIndex) return normalized

      normalized.deliverables = normalized.deliverables.map((d: any) => {
        const key = `${d.benefitCategory}|||${d.itemName}`
        if (key === delivKey) return { ...d, status: newStatus, publishedLink: newLink }
        return d
      })

      return normalized
    })

    const res = await fetch(`/api/sponsors/${sponsorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventParticipations: updatedParticipations }),
    })
    if (!res.ok) throw new Error('Error al guardar el entregable')

    setSponsors(prev => prev.map(s => (String(s.id) === String(sponsorId) ? { ...s, eventParticipations: updatedParticipations } : s)))
  }, [sponsors])

  useEffect(() => {
    fetch('/api/sponsors?limit=300&depth=2', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setSponsors(d.docs || []))
      .finally(() => setLoading(false))
  }, [])

  const plans = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sponsors) {
      const part = activePart(s)
      const plan = part?.plan
      if (!plan) continue
      const id = typeof plan === 'object' ? String(plan.id) : String(plan)
      map.set(id, normalizePlan(plan))
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [sponsors])

  const availableTiers = useMemo(() => {
    const present = new Set(sponsors.map(s => s.tier).filter(Boolean))
    return TIER_OPTIONS.filter(t => present.has(t))
  }, [sponsors])

  const activeAdvancedFilterCount =
    tierFilter.length +
    (overdueFilter !== null ? 1 : 0) +
    (completionFilter !== 'all' ? 1 : 0) +
    (publishedFilter !== 'all' ? 1 : 0) +
    (dueDateFilter !== 'all' ? 1 : 0) +
    Object.values(columnFilters).filter(v => v.length > 0).length

  const filtered = useMemo(() => {
    return sponsors.filter(s => {
      const part = activePart(s)
      if (!part) return false
      if (search && !s.companyName?.toLowerCase().includes(search.toLowerCase())) return false
      if (planFilter !== 'all') {
        const planId = typeof part.plan === 'object' ? String(part.plan.id) : String(part.plan)
        if (planId !== planFilter) return false
      }
      if (statusFilter === 'complete') {
        const delivs = part.deliverables || []
        if (!delivs.length || !delivs.every((d: any) => d.status === 'completed')) return false
      }
      if (statusFilter === 'pending') {
        const delivs = part.deliverables || []
        if (delivs.every((d: any) => d.status === 'completed')) return false
      }

      // --- Filtros avanzados ---
      if (tierFilter.length > 0 && !tierFilter.includes(s.tier)) return false

      if (completionFilter !== 'all') {
        const delivs = part.deliverables || []
        const total = delivs.length
        const completed = delivs.filter((d: any) => d.status === 'completed').length
        if (completionFilter === 'none' && completed !== 0) return false
        if (completionFilter === 'partial' && !(completed > 0 && completed < total)) return false
        if (completionFilter === 'complete' && !(completed === total && total > 0)) return false
      }

      if (overdueFilter !== null) {
        const delivs = part.deliverables || []
        const hasOverdue = delivs.some((d: any) => d.status === 'overdue')
        if (overdueFilter === true && !hasOverdue) return false
        if (overdueFilter === false && hasOverdue) return false
      }

      if (publishedFilter !== 'all') {
        const delivs = part.deliverables || []
        const hasPublished = delivs.some((d: any) => d.status === 'published')
        if (publishedFilter === 'published' && !hasPublished) return false
        if (publishedFilter === 'unpublished' && hasPublished) return false
      }

      if (dueDateFilter !== 'all') {
        const delivs = part.deliverables || []
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayMs = todayStart.getTime()
        const sevenDaysMs = todayMs + 7 * DAY_MS
        if (dueDateFilter === 'overdue' && !delivs.some((d: any) => isOverdueDeliv(d, todayMs))) return false
        if (dueDateFilter === 'due_soon' && !delivs.some((d: any) => isDueSoonDeliv(d, todayMs, sevenDaysMs))) return false
        if (
          dueDateFilter === 'ok' &&
          delivs.some((d: any) => isOverdueDeliv(d, todayMs) || isDueSoonDeliv(d, todayMs, sevenDaysMs))
        )
          return false
      }

      return true
    })
  }, [sponsors, search, planFilter, statusFilter, tierFilter, completionFilter, overdueFilter, publishedFilter, dueDateFilter])

  const cols = useMemo<DeliverableCol[]>(() => {
    const map = new Map<string, DeliverableCol>()
    for (const s of filtered) {
      const part = activePart(s)
      for (const d of part?.deliverables || []) {
        const key = `${d.benefitCategory}|||${d.itemName}`
        if (!map.has(key)) map.set(key, { key, itemName: d.itemName, benefitCategory: d.benefitCategory || '', type: d.type || 'text' })
      }
    }
    return Array.from(map.values())
  }, [filtered])

  const rows = useMemo<SponsorRow[]>(() => {
    const activeColumnFilters = Object.entries(columnFilters).filter(([, v]) => v.length > 0)
    const result: SponsorRow[] = []
    for (const s of filtered) {
      const part = activePart(s)
      const delivMap: Record<string, any> = {}
      let total = 0, completed = 0
      for (const d of part?.deliverables || []) {
        const key = `${d.benefitCategory}|||${d.itemName}`
        delivMap[key] = d; total++
        if (d.status === 'completed') completed++
      }

      let passesColumnFilters = true
      for (const [colKey, allowedStatuses] of activeColumnFilters) {
        const deliv = delivMap[colKey]
        const isEmpty = !deliv || deliv.status == null
        const matchesEmpty = allowedStatuses.includes('__empty__') && isEmpty
        const matchesStatus = !isEmpty && allowedStatuses.includes(deliv.status)
        if (!matchesEmpty && !matchesStatus) {
          passesColumnFilters = false
          break
        }
      }
      if (!passesColumnFilters) continue

      result.push({ id: s.id, name: s.companyName || 'Sin nombre', planName: normalizePlan(part?.plan), deliverables: delivMap, total, completed })
    }
    return result
  }, [filtered, columnFilters])

  const stats = useMemo(() => {
    let totalDelivs = 0, completedDelivs = 0
    for (const r of rows) { totalDelivs += r.total; completedDelivs += r.completed }
    return { sponsors: rows.length, completed: completedDelivs, pending: totalDelivs - completedDelivs, pct: totalDelivs ? Math.round(completedDelivs / totalDelivs * 100) : 0 }
  }, [rows])

  const exportCSV = () => {
    const headers = ['Sponsor', 'Plan', 'Completados', 'Total', ...cols.map(c => c.itemName)]
    const csvRows = rows.map(r => [r.name, r.planName, r.completed, r.total, ...cols.map(c => { const d = r.deliverables[c.key]; if (!d) return 'N/A'; if (d.status === 'completed') return 'Enviado'; if (d.status === 'overdue') return 'Vencido'; return 'Pendiente' })])
    const csv = [headers, ...csvRows].map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `entregables-CTW-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  const COL_W = 148

  return (
    <>
      <Modal data={modalData} onClose={closeModal} onSave={handleSaveDeliverable} />
      <div style={{ padding: '1.75rem 2rem', minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>CS Dashboard</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--theme-elevation-500)', margin: '0.25rem 0 0' }}>Entregables por cuenta — vista completa</p>
          </div>
          <button type="button" onClick={exportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', background: 'var(--theme-text)', color: 'var(--theme-bg)', border: 'none', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar CSV
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
          {[{ label: 'Cuentas', value: stats.sponsors }, { label: 'Enviados', value: stats.completed, color: '#10b981' }, { label: 'Pendientes', value: stats.pending, color: '#f59e0b' }, { label: 'Completitud', value: `${stats.pct}%` }].map(s => (
            <div key={s.label} style={{ background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-150)', borderRadius: '8px', padding: '0.875rem 1rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--theme-elevation-500)', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.03em', color: s.color || 'var(--theme-text)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '180px', maxWidth: '280px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Buscar cuenta..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-200)', borderRadius: '6px', color: 'var(--theme-text)', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-200)', borderRadius: '6px', color: 'var(--theme-text)', fontSize: '0.875rem', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
            <option value="all">Todos los planes</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[{ val: 'all', label: 'Todos' }, { val: 'pending', label: 'Con pendientes' }, { val: 'complete', label: '100% completos' }].map(opt => (
              <button key={opt.val} type="button" onClick={() => setStatusFilter(opt.val)} style={{ padding: '0.35rem 0.875rem', borderRadius: '99px', border: `1px solid ${statusFilter === opt.val ? 'var(--theme-text)' : 'var(--theme-elevation-200)'}`, background: statusFilter === opt.val ? 'var(--theme-text)' : 'transparent', color: statusFilter === opt.val ? 'var(--theme-bg)' : 'var(--theme-text)', fontSize: '0.8125rem', fontWeight: statusFilter === opt.val ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>{opt.label}</button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.35rem 0.875rem', borderRadius: '99px', border: `1px solid ${filtersOpen ? 'var(--theme-text)' : 'var(--theme-elevation-200)'}`, background: filtersOpen ? 'var(--theme-text)' : 'transparent', color: filtersOpen ? 'var(--theme-bg)' : 'var(--theme-text)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Filter size={13} />
            Filtros avanzados
            {activeAdvancedFilterCount > 0 && (
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
            )}
          </button>
          <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--theme-elevation-500)' }}>
            {rows.length} cuenta{rows.length !== 1 ? 's' : ''} · {cols.length} entregable{cols.length !== 1 ? 's' : ''}
            {activeAdvancedFilterCount > 0 ? ` · ${activeAdvancedFilterCount} filtros activos` : ''}
          </span>
        </div>

        {filtersOpen && (
          <div style={{ background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-200)', borderRadius: '8px', padding: '16px', marginTop: '8px', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={filterLabelStyle}>Tier</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {availableTiers.map(t => {
                  const active = tierFilter.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTierFilter(prev => (active ? prev.filter(x => x !== t) : [...prev, t]))}
                      style={chipStyle(active)}
                    >
                      {t}
                    </button>
                  )
                })}
                {availableTiers.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--theme-elevation-400)' }}>Sin datos</span>
                )}
              </div>
            </div>

            <div>
              <div style={filterLabelStyle}>Completitud</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {COMPLETION_OPTIONS.map(opt => (
                  <button key={opt.val} type="button" onClick={() => setCompletionFilter(opt.val)} style={chipStyle(completionFilter === opt.val)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={filterLabelStyle}>Entregables vencidos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button type="button" onClick={() => setOverdueFilter(null)} style={chipStyle(overdueFilter === null)}>Todos</button>
                <button type="button" onClick={() => setOverdueFilter(true)} style={chipStyle(overdueFilter === true)}>Con vencidos</button>
                <button type="button" onClick={() => setOverdueFilter(false)} style={chipStyle(overdueFilter === false)}>Sin vencidos</button>
              </div>
            </div>

            <div>
              <div style={filterLabelStyle}>Publicación</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button type="button" onClick={() => setPublishedFilter('all')} style={chipStyle(publishedFilter === 'all')}>Todos</button>
                <button type="button" onClick={() => setPublishedFilter('published')} style={chipStyle(publishedFilter === 'published')}>Con publicados</button>
                <button type="button" onClick={() => setPublishedFilter('unpublished')} style={chipStyle(publishedFilter === 'unpublished')}>Sin publicados</button>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={filterLabelStyle}>Fecha límite</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button type="button" onClick={() => setDueDateFilter('all')} style={chipStyle(dueDateFilter === 'all')}>Todos</button>
                <button type="button" onClick={() => setDueDateFilter('overdue')} style={chipStyle(dueDateFilter === 'overdue')}>Vencidos</button>
                <button type="button" onClick={() => setDueDateFilter('due_soon')} style={chipStyle(dueDateFilter === 'due_soon')}>Próximos 7 días</button>
                <button type="button" onClick={() => setDueDateFilter('ok')} style={chipStyle(dueDateFilter === 'ok')}>Al día</button>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setTierFilter([])
                  setOverdueFilter(null)
                  setCompletionFilter('all')
                  setPublishedFilter('all')
                  setDueDateFilter('all')
                }}
                style={{ padding: '0.4rem 0.875rem', borderRadius: '6px', border: '1px solid var(--theme-elevation-200)', background: 'transparent', color: 'var(--theme-elevation-500)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', padding: '2rem 0' }}>Cargando sponsors…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', padding: '2rem 0' }}>No hay cuentas que coincidan con los filtros.</p>
        ) : (
          <div onScroll={() => setOpenColumnFilter(null)} style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: '8px', overflow: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: `${240 + cols.length * COL_W}px` }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                  <th style={{ ...thBase, position: 'sticky', left: 0, zIndex: 25, minWidth: '200px', width: '200px', textAlign: 'left' }}>Cuenta</th>
                  <th style={{ ...thBase, minWidth: '110px', width: '110px', textAlign: 'left' }}>Plan</th>
                  <th style={{ ...thBase, minWidth: '90px', width: '90px', textAlign: 'center' }}>Avance</th>
                  {cols.map(c => {
                    const colFilterActive = (columnFilters[c.key]?.length ?? 0) > 0
                    return (
                      <th key={c.key} style={{ ...thBase, minWidth: `${COL_W}px`, width: `${COL_W}px`, textAlign: 'center', position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: `${COL_W - 16}px` }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} title={c.itemName}>{c.itemName}</span>
                            <button
                              type="button"
                              title="Filtrar columna"
                              onClick={e => {
                                e.stopPropagation()
                                setOpenColumnFilter(prev => (prev === c.key ? null : c.key))
                              }}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: colFilterActive ? '#FEDD5A' : 'var(--theme-elevation-400)', flexShrink: 0 }}
                            >
                              <SlidersHorizontal size={12} />
                            </button>
                          </div>
                          {c.benefitCategory && <span style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }} title={c.benefitCategory}>{c.benefitCategory}</span>}
                        </div>

                        {openColumnFilter === c.key && (
                          <div
                            onClick={e => e.stopPropagation()}
                            style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'var(--theme-elevation-100)', border: '1px solid var(--theme-elevation-200)', borderRadius: '8px', padding: '8px', minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', textAlign: 'left', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400 }}
                          >
                            {COLUMN_FILTER_STATUSES.map(opt => {
                              const checked = columnFilters[c.key]?.includes(opt.val) ?? false
                              return (
                                <div
                                  key={opt.val}
                                  onClick={() => {
                                    setColumnFilters(prev => {
                                      const current = prev[c.key] || []
                                      const next = checked ? current.filter(v => v !== opt.val) : [...current, opt.val]
                                      return { ...prev, [c.key]: next }
                                    })
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--theme-elevation-150)' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '' }}
                                  style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8125rem', color: 'var(--theme-text)' }}
                                >
                                  <input type="checkbox" checked={checked} readOnly style={{ pointerEvents: 'none' }} />
                                  {opt.label}
                                </div>
                              )
                            })}
                            {(() => {
                              const emptyChecked = columnFilters[c.key]?.includes('__empty__') ?? false
                              return (
                                <div
                                  onClick={() => {
                                    setColumnFilters(prev => {
                                      const current = prev[c.key] || []
                                      const next = emptyChecked
                                        ? current.filter(v => v !== '__empty__')
                                        : [...current, '__empty__']
                                      return { ...prev, [c.key]: next }
                                    })
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--theme-elevation-150)' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '' }}
                                  style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8125rem', color: 'var(--theme-text)', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--theme-elevation-200)' }}
                                >
                                  <input type="checkbox" checked={emptyChecked} readOnly style={{ pointerEvents: 'none' }} />
                                  (Vacío)
                                </div>
                              )
                            })()}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--theme-elevation-150)' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setColumnFilters(prev => {
                                    const next = { ...prev }
                                    delete next[c.key]
                                    return next
                                  })
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--theme-elevation-500)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '2px 4px' }}
                              >
                                Limpiar
                              </button>
                            </div>
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const pct = row.total ? Math.round(row.completed / row.total * 100) : 0
                  return (
                    <tr key={String(row.id)} style={{ borderTop: '1px solid var(--theme-elevation-100)', background: ri % 2 !== 0 ? 'var(--theme-elevation-50)' : 'var(--theme-bg)' }}>
                      <td style={{ ...tdBase, position: 'sticky', left: 0, zIndex: 10, background: ri % 2 !== 0 ? 'var(--theme-elevation-50)' : 'var(--theme-bg)', borderRight: '1px solid var(--theme-elevation-150)', padding: '0.75rem 1rem' }}>
                        <a href={`/admin/collections/sponsors/${row.id}`} style={{ fontWeight: 600, color: 'var(--theme-text)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={row.name}>{row.name}</a>
                      </td>
                      <td style={{ ...tdBase, whiteSpace: 'nowrap', color: 'var(--theme-elevation-600)', fontSize: '0.8125rem' }}>{row.planName}</td>
                      <td style={{ ...tdBase, textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: pct === 100 ? '#065f46' : 'var(--theme-text)' }}>{row.completed}<span style={{ opacity: 0.4, fontWeight: 400 }}>/{row.total}</span></span>
                          <div style={{ width: '52px', height: '4px', background: 'var(--theme-elevation-150)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : '#f59e0b', borderRadius: '99px' }} />
                          </div>
                        </div>
                      </td>
                      {cols.map(c => (
                        <td key={c.key} style={{ ...tdBase, padding: '6px 4px', height: '52px' }}>
                          <DelivCell deliv={row.deliverables[c.key]} colType={c.type} sponsorName={row.name} colName={c.itemName} sponsorId={row.id} delivKey={c.key} onOpen={setModalData} />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

const thBase: React.CSSProperties = {
  padding: '0.625rem 0.875rem',
  background: 'var(--theme-elevation-100)',
  borderBottom: '1px solid var(--theme-elevation-200)',
  fontSize: '0.6875rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--theme-elevation-600)',
  whiteSpace: 'nowrap',
}

const tdBase: React.CSSProperties = {
  padding: '0.625rem 0.875rem',
  verticalAlign: 'middle',
  color: 'var(--theme-text)',
}

const filterLabelStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--theme-elevation-500)',
  marginBottom: '8px',
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.3rem 0.75rem',
    borderRadius: '99px',
    border: active ? 'none' : '1px solid var(--theme-elevation-200)',
    background: active ? 'var(--theme-text)' : 'transparent',
    color: active ? 'var(--theme-bg)' : 'var(--theme-text)',
    fontSize: '0.75rem',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}
