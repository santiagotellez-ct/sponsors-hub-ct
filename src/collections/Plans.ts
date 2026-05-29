import type { CollectionConfig } from 'payload'

export const Plans: CollectionConfig = {
  slug: 'plans',
  admin: {
    useAsTitle: 'name',
    group: 'Configuración',
    components: {
      beforeListTable: ['@/components/admin/DuplicatePlanButton#DuplicatePlanButton'],
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre del Plan / Tier',
    },
    {
      name: 'addonsDiscount',
      type: 'number',
      label: '% de Descuento en Add-ons',
    },
    {
      name: 'benefits',
      type: 'array',
      label: 'Beneficios',
      labels: { singular: 'Beneficio', plural: 'Beneficios' },
      fields: [
        {
          name: 'benefitName',
          type: 'text',
          required: true,
          label: 'Categoría de Beneficio',
        },
        {
          name: 'hasDeliverable',
          type: 'checkbox',
          label: '¿Este beneficio exige uno o más entregables?',
          defaultValue: false,
        },
        {
          name: 'unlockDate',
          type: 'date',
          label: 'Fecha de habilitación de la categoría',
          admin: {
            description:
              'Opcional. Si se define, todos los entregables de esta categoría se habilitan a partir de esta fecha. Cada entregable puede tener su propia fecha que sobreescribe esta.',
            condition: (_data, siblingData) => siblingData?.hasDeliverable === true,
          },
        },
        {
          name: 'deliverables',
          type: 'array',
          label: 'Entregables Exigidos',
          admin: {
            condition: (_data, siblingData) => siblingData?.hasDeliverable === true,
          },
          fields: [
            {
              name: 'deliverableName',
              type: 'text',
              required: true,
              label: 'Nombre del Entregable',
            },
            {
              name: 'type',
              type: 'select',
              required: true,
              label: 'Tipo de Entregable',
              options: [
                { label: 'Archivo / Media (imagen, PDF, SVG)', value: 'document' },
                { label: 'Imagen', value: 'image' },
                { label: 'Texto', value: 'text' },
                { label: 'Enlace / URL', value: 'link' }, // NUEVO TIPO AGREGADO
                { label: 'Comunicación Directa', value: 'direct' },
                { label: 'Acción Externa (Link)', value: 'action_link' },
                { label: 'Formulario', value: 'formulario' },
              ],
            },
            {
              name: 'actionUrl',
              type: 'text',
              label: 'URL de la Acción',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'action_link',
              },
            },
            {
              name: 'formId',
              type: 'relationship',
              relationTo: 'forms',
              label: 'Formulario vinculado',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'formulario',
                description: 'Selecciona el formulario que debe completar el sponsor.',
              },
            },
            {
              name: 'referenceTitle',
              type: 'text',
              label: 'Título de referencia',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'formulario',
                description: 'Ej: "Así se verá tu video en el evento". Se muestra al sponsor antes de rellenar el formulario.',
              },
            },
            {
              name: 'referenceImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Imagen de referencia',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'formulario',
                description: 'Vista previa en miniatura; el sponsor puede ampliarla.',
              },
            },
            {
              name: 'referencePdf',
              type: 'upload',
              relationTo: 'media',
              label: 'PDF de referencia',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'formulario',
                description: 'Se abrirá en nueva pestaña.',
              },
            },
            {
              name: 'referenceLink',
              type: 'text',
              label: 'Link de referencia',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'formulario',
                description: 'URL de ejemplo o referencia visual (se muestra como botón).',
              },
            },
            { name: 'dueDate', type: 'date', required: true, label: 'Fecha Máxima' },
            {
              name: 'unlockDate',
              type: 'date',
              label: 'Fecha de habilitación del entregable',
              admin: {
                description:
                  'Opcional. Sobreescribe la fecha de la categoría para este entregable específico. Si no se define, se usa la de la categoría.',
              },
            },
            {
              name: 'relatedItems',
              type: 'json',
              label: 'Ítems relacionados',
              admin: {
                description: 'Selecciona los ítems del beneficio a los que aplica este entregable.',
                components: {
                  Field: '@/components/admin/RelatedItemsPicker#RelatedItemsPicker',
                },
              },
            },
          ],
        },
        {
          name: 'items',
          type: 'array',
          label: 'Items del Beneficio',
          labels: { singular: 'Item', plural: 'Items' },
          fields: [{ name: 'itemName', type: 'text', required: true, label: 'Nombre del Item' }],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'update') {
          try {
            const { docs: sponsors } = await req.payload.find({
              collection: 'sponsors',
              limit: 1000,
              depth: 0,
            })

            const normalizeRelated = (items: any): string[] => {
              if (!Array.isArray(items)) return []
              return items
                .map((r: any) => (typeof r === 'string' ? r : r?.itemName))
                .filter(Boolean)
            }
            const normalizeId = (id: any) =>
              id ? (typeof id === 'object' ? id.id : id) : null

            for (const sponsor of sponsors as any[]) {
              let hasChanges = false
              const eventParticipations = sponsor.eventParticipations || []

              for (let i = 0; i < eventParticipations.length; i++) {
                const participation = eventParticipations[i]
                const planId =
                  typeof participation.plan === 'object'
                    ? participation.plan.id
                    : participation.plan

                if (planId !== doc.id) continue

                const newDeliverables = [...(participation.deliverables || [])]
                const newBenefitItems = [...(participation.benefitItems || [])]

                if (!doc.benefits) continue

                doc.benefits.forEach((benefit: any) => {
                  const benefitCat = benefit.benefitName

                  // ── Sync deliverables ──
                  if (benefit.hasDeliverable && benefit.deliverables) {
                    benefit.deliverables.forEach((planDeliv: any) => {
                      const effectiveUnlockDate = planDeliv.unlockDate ?? benefit.unlockDate ?? null

                      // 1. Match by stable planDeliverableId
                      let existingIndex = newDeliverables.findIndex(
                        (d) => d.source === 'plan' && d.planDeliverableId === planDeliv.id,
                      )
                      // 2. Fallback: match by category + name (migrates old data without stable ID)
                      if (existingIndex < 0) {
                        existingIndex = newDeliverables.findIndex(
                          (d) =>
                            d.source !== 'custom' &&
                            d.benefitCategory === benefitCat &&
                            d.itemName === planDeliv.deliverableName,
                        )
                      }

                      if (existingIndex >= 0) {
                        const existing = newDeliverables[existingIndex]
                        if (existing.source === 'custom') return

                        const incomingRelated = normalizeRelated(planDeliv.relatedItems)
                        const existingRelated = normalizeRelated(existing.relatedItemNames)
                        const incomingFormId = normalizeId(planDeliv.formId)
                        const existingFormId = normalizeId(existing.formId)

                        const incomingRefImg = normalizeId(planDeliv.referenceImage)
                        const incomingRefPdf = normalizeId(planDeliv.referencePdf)

                        if (
                          existing.planDeliverableId !== planDeliv.id ||
                          existing.benefitCategory !== benefitCat ||
                          existing.itemName !== planDeliv.deliverableName ||
                          existing.type !== planDeliv.type ||
                          existing.dueDate !== planDeliv.dueDate ||
                          existing.actionUrl !== (planDeliv.actionUrl ?? null) ||
                          existing.unlockDate !== effectiveUnlockDate ||
                          existingFormId !== incomingFormId ||
                          JSON.stringify(existingRelated) !== JSON.stringify(incomingRelated) ||
                          existing.referenceTitle !== (planDeliv.referenceTitle ?? null) ||
                          normalizeId(existing.referenceImage) !== incomingRefImg ||
                          normalizeId(existing.referencePdf) !== incomingRefPdf ||
                          existing.referenceLink !== (planDeliv.referenceLink ?? null)
                        ) {
                          newDeliverables[existingIndex] = {
                            ...existing,
                            planDeliverableId: planDeliv.id,
                            benefitCategory: benefitCat,
                            itemName: planDeliv.deliverableName,
                            type: planDeliv.type,
                            dueDate: planDeliv.dueDate,
                            actionUrl: planDeliv.actionUrl,
                            unlockDate: effectiveUnlockDate,
                            formId: incomingFormId,
                            relatedItemNames: incomingRelated,
                            referenceTitle: planDeliv.referenceTitle ?? null,
                            referenceImage: incomingRefImg,
                            referencePdf: incomingRefPdf,
                            referenceLink: planDeliv.referenceLink ?? null,
                          }
                          hasChanges = true
                        }
                      } else {
                        newDeliverables.push({
                          source: 'plan',
                          planDeliverableId: planDeliv.id,
                          benefitCategory: benefitCat,
                          itemName: planDeliv.deliverableName,
                          type: planDeliv.type,
                          actionUrl: planDeliv.actionUrl,
                          dueDate: planDeliv.dueDate,
                          unlockDate: effectiveUnlockDate,
                          formId: normalizeId(planDeliv.formId),
                          status: 'pending',
                          relatedItemNames: normalizeRelated(planDeliv.relatedItems),
                          referenceTitle: planDeliv.referenceTitle ?? null,
                          referenceImage: normalizeId(planDeliv.referenceImage),
                          referencePdf: normalizeId(planDeliv.referencePdf),
                          referenceLink: planDeliv.referenceLink ?? null,
                        })
                        hasChanges = true
                      }
                    })
                  }

                  // ── Sync benefitItems ──
                  if (benefit.items) {
                    benefit.items.forEach((planItem: any) => {
                      // 1. Match by stable planBenefitItemId
                      let existingIndex = newBenefitItems.findIndex(
                        (bi) => bi.source === 'plan' && bi.planBenefitItemId === planItem.id,
                      )
                      // 2. Fallback: match by category + name
                      if (existingIndex < 0) {
                        existingIndex = newBenefitItems.findIndex(
                          (bi) =>
                            bi.source !== 'custom' &&
                            bi.benefitCategory === benefitCat &&
                            bi.itemName === planItem.itemName,
                        )
                      }

                      if (existingIndex >= 0) {
                        const existing = newBenefitItems[existingIndex]
                        if (existing.source === 'custom') return

                        if (
                          existing.planBenefitItemId !== planItem.id ||
                          existing.benefitCategory !== benefitCat ||
                          existing.itemName !== planItem.itemName
                        ) {
                          newBenefitItems[existingIndex] = {
                            ...existing,
                            planBenefitItemId: planItem.id,
                            benefitCategory: benefitCat,
                            itemName: planItem.itemName,
                          }
                          hasChanges = true
                        }
                      } else {
                        newBenefitItems.push({
                          source: 'plan',
                          planBenefitItemId: planItem.id,
                          benefitCategory: benefitCat,
                          itemName: planItem.itemName,
                          status: 'not_started',
                        })
                        hasChanges = true
                      }
                    })
                  }
                })

                if (hasChanges) {
                  participation.deliverables = newDeliverables
                  participation.benefitItems = newBenefitItems
                }
              }

              if (hasChanges) {
                await req.payload.update({
                  collection: 'sponsors',
                  id: sponsor.id,
                  data: { eventParticipations },
                  req,
                })
                console.log(
                  `[Plan Sync] Actualizado sponsor ${sponsor.companyName} tras edición del plan ${doc.name}`,
                )
              }
            }
          } catch (e) {
            console.error('[Plan Sync] Error sincronizando sponsors desde el Plan:', e)
          }
        }
        return doc
      },
    ],
  },
}
