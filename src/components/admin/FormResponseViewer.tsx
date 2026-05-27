'use client'

import React, { useEffect, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

type Props = {
  path: string
  label?: string
}

export const FormResponseViewer: React.FC<Props> = ({ path, label }) => {
  const { value } = useField<any>({ path })
  const [formDef, setFormDef] = useState<any>(null)

  // Derive sibling formId path: "…deliverables.N.formResponse" → "…deliverables.N.formId"
  const formIdPath = path.replace(/\.formResponse$/, '.formId')

  const rawFormId = useFormFields(([fields]) => fields[formIdPath]?.value)
  const formId = rawFormId ? String(rawFormId) : undefined

  useEffect(() => {
    if (!formId) {
      setFormDef(null)
      return
    }
    fetch(`/api/forms/${formId}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setFormDef(data ?? null))
      .catch(() => setFormDef(null))
  }, [formId])

  const response =
    value && typeof value === 'object' ? (value as Record<string, any>) : null

  const entries: { label: string; key: string; type: string; value: any }[] =
    formDef?.fields
      ? (formDef.fields as any[]).map((f: any) => ({
          label: f.label,
          key: f.fieldKey,
          type: f.type,
          value: response?.[f.fieldKey],
        }))
      : response
        ? Object.entries(response).map(([k, v]) => ({
            label: k,
            key: k,
            type: 'text',
            value: v,
          }))
        : []

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        className="field-label"
        style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}
      >
        {label ?? 'Respuestas del formulario'}
      </label>

      {!entries.length ? (
        <p style={{ fontSize: 12, color: '#71717a', fontStyle: 'italic' }}>
          Sin respuestas enviadas aún.
        </p>
      ) : (
        <div
          style={{
            border: '1px solid var(--theme-elevation-150, #e4e4e7)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {entries.map((entry, i) => (
            <div
              key={entry.key}
              style={{
                display: 'flex',
                gap: 16,
                padding: '10px 14px',
                borderBottom:
                  i < entries.length - 1
                    ? '1px solid var(--theme-elevation-100, #f0f0f1)'
                    : 'none',
                backgroundColor:
                  i % 2 === 0 ? 'var(--theme-elevation-50, #fafafa)' : 'transparent',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#71717a',
                  minWidth: 150,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {entry.label}
              </span>
              <span
                style={{ fontSize: 13, color: '#18181b', flex: 1, wordBreak: 'break-all' }}
              >
                {entry.type === 'checkbox'
                  ? entry.value
                    ? 'Sí'
                    : 'No'
                  : entry.type === 'image' && entry.value?.url
                    ? entry.value.url
                    : entry.value != null
                      ? String(entry.value)
                      : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FormResponseViewer
