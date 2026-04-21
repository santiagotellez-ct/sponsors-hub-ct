import type { CollectionConfig } from 'payload'

export const Plans: CollectionConfig = {
  slug: 'plans',
  admin: {
    useAsTitle: 'name',
    group: 'Configuración',
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
          name: 'deliverables',
          type: 'array',
          label: 'Entregables Exigidos',
          admin: {
            condition: (data, siblingData) => siblingData?.hasDeliverable === true,
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
            { name: 'dueDate', type: 'date', required: true, label: 'Fecha Máxima' },
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
            // Find all sponsors (we fetch all to avoid nested array query complexities in Payload)
            // Limit 1000 is safe for B2B scale.
            const { docs: sponsors } = await req.payload.find({
              collection: 'sponsors',
              limit: 1000,
              depth: 0,
            })

            for (const sponsor of sponsors as any[]) {
              let hasChanges = false
              const eventParticipations = sponsor.eventParticipations || []

              for (let i = 0; i < eventParticipations.length; i++) {
                const participation = eventParticipations[i]
                const planId =
                  typeof participation.plan === 'object'
                    ? participation.plan.id
                    : participation.plan

                // Si el sponsor está participando con ESTE plan que acaba de ser modificado
                if (planId === doc.id) {
                  const currentDeliverables = participation.deliverables || []
                  const currentBenefitItems = participation.benefitItems || []

                  const newDeliverables = [...currentDeliverables]
                  const newBenefitItems = [...currentBenefitItems]

                  if (doc.benefits) {
                    doc.benefits.forEach((benefit: any) => {
                      const benefitCat = benefit.benefitName

                      // Sincronizar entregables (Sponsor)
                      if (benefit.hasDeliverable && benefit.deliverables) {
                        benefit.deliverables.forEach((planDeliv: any) => {
                          const existingIndex = newDeliverables.findIndex(
                            (d) =>
                              d.benefitCategory === benefitCat &&
                              d.itemName === planDeliv.deliverableName,
                          )

                          if (existingIndex >= 0) {
                            const existingDeliv = newDeliverables[existingIndex]
                            // Actualizar propiedades administrativas en silencio
                            if (
                              existingDeliv.type !== planDeliv.type ||
                              existingDeliv.dueDate !== planDeliv.dueDate ||
                              existingDeliv.actionUrl !== planDeliv.actionUrl
                            ) {
                              newDeliverables[existingIndex] = {
                                ...existingDeliv,
                                type: planDeliv.type,
                                dueDate: planDeliv.dueDate,
                                actionUrl: planDeliv.actionUrl,
                              }
                              hasChanges = true
                            }
                          } else {
                            // Agregar nuevo entregable requerido
                            newDeliverables.push({
                              benefitCategory: benefitCat,
                              itemName: planDeliv.deliverableName,
                              type: planDeliv.type,
                              actionUrl: planDeliv.actionUrl,
                              dueDate: planDeliv.dueDate,
                              status: 'pending',
                            })
                            hasChanges = true
                          }
                        })
                      }

                      // Sincronizar items (Evidencias de Admin)
                      if (benefit.items) {
                        benefit.items.forEach((planItem: any) => {
                          const existingExists = newBenefitItems.some(
                            (i) =>
                              i.benefitCategory === benefitCat && i.itemName === planItem.itemName,
                          )

                          if (!existingExists) {
                            newBenefitItems.push({
                              benefitCategory: benefitCat,
                              itemName: planItem.itemName,
                              status: 'not_started',
                            })
                            hasChanges = true
                          }
                        })
                      }
                    })
                  }

                  if (hasChanges) {
                    participation.deliverables = newDeliverables
                    participation.benefitItems = newBenefitItems
                  }
                }
              }

              // Si hubo cambios en este sponsor, guardamos
              if (hasChanges) {
                // Importante: usamos req interno y skipHooks si es necesario para evitar loops,
                // aunque Sponsors no triggerea a Plans.
                await req.payload.update({
                  collection: 'sponsors',
                  id: sponsor.id,
                  data: {
                    eventParticipations,
                  },
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
