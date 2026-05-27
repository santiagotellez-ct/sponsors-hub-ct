'use client'

import React, { useCallback } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

type Props = {
  path: string
  readOnly?: boolean
  label?: string
}

export const RelatedItemsPicker: React.FC<Props> = ({ path, readOnly, label }) => {
  const { value, setValue } = useField<string[] | null>({ path })

  // Parse benefit index from path: "benefits.N.deliverables.M.relatedItems"
  const pathParts = path.split('.')
  const benefitsKeyIdx = pathParts.indexOf('benefits')
  const benefitIndex = benefitsKeyIdx !== -1 ? parseInt(pathParts[benefitsKeyIdx + 1], 10) : -1

  // Iterate over "benefits.N.items.0.itemName", "benefits.N.items.1.itemName", etc.
  const benefitItems = useFormFields(([fields]) => {
    if (benefitIndex < 0) return []
    const items: string[] = []
    let i = 0
    while (i < 50) {
      const field = fields[`benefits.${benefitIndex}.items.${i}.itemName`]
      if (!field) break
      const name = field.value as string
      if (name) items.push(name)
      i++
    }
    return items
  })

  const selected: string[] = Array.isArray(value) ? value : []

  const toggle = useCallback(
    (itemName: string) => {
      if (readOnly) return
      const next = selected.includes(itemName)
        ? selected.filter((s) => s !== itemName)
        : [...selected, itemName]
      setValue(next)
    },
    [selected, setValue, readOnly],
  )

  return (
    <div className="field-type" style={{ marginBottom: 16 }}>
      <label className="field-label" style={{ display: 'block', marginBottom: 8 }}>
        {label ?? 'Ítems relacionados'}
      </label>
      {!benefitItems || benefitItems.length === 0 ? (
        <p style={{ fontSize: 12, color: '#71717a' }}>
          Agrega ítems en la sección "Items del Beneficio" primero.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {benefitItems.map((itemName) => (
            <label
              key={itemName}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: readOnly ? 'default' : 'pointer',
                fontSize: 13,
                color: '#18181b',
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(itemName)}
                onChange={() => toggle(itemName)}
                disabled={readOnly}
                style={{ width: 14, height: 14 }}
              />
              {itemName}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default RelatedItemsPicker
