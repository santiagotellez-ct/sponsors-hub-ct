'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Plan = { id: string; name: string }

export const DuplicatePlanButton: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleOpen = async () => {
    const res = await fetch('/api/plans?limit=100&depth=0', { credentials: 'include' })
    const data = await res.json()
    setPlans(data.docs?.map((p: any) => ({ id: p.id, name: p.name })) || [])
    setSelectedId('')
    setOpen(true)
  }

  const handleDuplicate = async () => {
    if (!selectedId) return
    setLoading(true)
    try {
      const res = await fetch('/api/duplicate-plan', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      })
      const data = await res.json()
      if (data.id) {
        router.push(`/admin/collections/plans/${data.id}`)
      }
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleOpen}
          className="btn btn--style-secondary btn--size-small"
          type="button"
        >
          Duplicar Plan existente
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        padding: '0.75rem 1rem',
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
        Duplicar Plan:
      </span>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        style={{
          flex: 1,
          padding: '0.35rem 0.5rem',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '4px',
          background: 'var(--theme-bg)',
          color: 'var(--theme-text)',
        }}
      >
        <option value="">— seleccionar plan —</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleDuplicate}
        disabled={!selectedId || loading}
        className="btn btn--style-primary btn--size-small"
        type="button"
      >
        {loading ? 'Duplicando…' : 'Duplicar'}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="btn btn--style-secondary btn--size-small"
        type="button"
      >
        Cancelar
      </button>
    </div>
  )
}
