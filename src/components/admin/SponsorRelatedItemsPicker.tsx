'use client'

import React, { useCallback } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

type Props = {
  path: string
  readOnly?: boolean
  label?: string
}

export const SponsorRelatedItemsPicker: React.FC<Props> = ({ path, readOnly, label }) => {
  const { value, setValue } = useField<any>({ path })

  // path: "eventParticipations.N.deliverables.M.relatedItemNames"
  const pathParts = path.split('.')
  const epIdx = pathParts.indexOf('eventParticipations')
  const participationIndex = epIdx !== -1 ? parseInt(pathParts[epIdx + 1], 10) : -1
  const delivIdx = pathParts.indexOf('deliverables')
  const deliverableIndex = delivIdx !== -1 ? parseInt(pathParts[delivIdx + 1], 10) : -1

  const { benefitCategory, availableItems } = useFormFields(([fields]) => {
    if (participationIndex < 0 || deliverableIndex < 0) {
      return { benefitCategory: '', availableItems: [] }
    }

    const cat = fields[
      `eventParticipations.${participationIndex}.deliverables.${deliverableIndex}.benefitCategory`
    ]?.value as string | undefined

    const items: string[] = []
    let k = 0
    while (k < 200) {
      const nameField =
        fields[`eventParticipations.${participationIndex}.benefitItems.${k}.itemName`]
      const catField =
        fields[`eventParticipations.${participationIndex}.benefitItems.${k}.benefitCategory`]
      if (!nameField) break
      if (cat && catField?.value === cat && nameField.value) {
        items.push(nameField.value as string)
      }
      k++
    }

    return { benefitCategory: cat ?? '', availableItems: items }
  })

  // Normalizar el valor guardado: acepta string[] o [{itemName}][]
  const selected: string[] = Array.isArray(value)
    ? value.map((v: any) => (typeof v === 'string' ? v : v?.itemName)).filter(Boolean)
    : []

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
      {!availableItems || availableItems.length === 0 ? (
        <p style={{ fontSize: 12, color: '#71717a' }}>
          {benefitCategory
            ? `No hay ítems configurados para "${benefitCategory}".`
            : 'Sin categoría de beneficio asignada a este entregable.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {availableItems.map((itemName) => (
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

export default SponsorRelatedItemsPicker
