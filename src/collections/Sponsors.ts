import type { CollectionConfig } from 'payload'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  admin: {
    useAsTitle: 'companyName',
    defaultColumns: [
      'companyName',
      'contactInfo.corporateEmail',
      'eventsSummary',
      'currentPlanName',
    ],
  },
  auth: true,
  fields: [
    /* ==========================================
       CAMPOS FANTASMA (Para las columnas de Admin)
       ========================================== */
    {
      name: 'eventsSummary',
      type: 'text',
      label: 'Eventos Asignados',
      admin: { hidden: true },
    },
    {
      name: 'currentPlanName',
      type: 'text',
      label: 'Plan del Evento Actual',
      admin: { hidden: true },
    },

    /* ==========================================
       DATOS FIJOS 
       ========================================== */
    { name: 'companyName', type: 'text', required: true, label: 'Nombre de la Empresa' },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo de la Empresa' },
    {
      type: 'group',
      name: 'contactInfo',
      label: 'Datos de Contacto',
      fields: [
        { name: 'fullName', type: 'text', label: 'Nombre Completo' },
        { name: 'whatsapp', type: 'text', label: 'WhatsApp' },
        { name: 'corporateEmail', type: 'text', label: 'Email Corporativo' },
        { name: 'linkedin', type: 'text', label: 'LinkedIn URL' },
      ],
    },
    {
      type: 'group',
      name: 'whatsappGroup',
      label: 'Grupo de WhatsApp',
      fields: [
        { name: 'link', type: 'text', label: 'Link de Invitación' },
        { name: 'joined', type: 'checkbox', label: '¿Se unió al grupo?', defaultValue: false },
      ],
    },
    {
      name: 'documents',
      type: 'array',
      label: 'Documentos Administrativos',
      fields: [
        { name: 'name', type: 'text', label: 'Nombre del Documento' },
        { name: 'file', type: 'upload', relationTo: 'media', label: 'Archivo' },
      ],
    },

    /* ==========================================
       DATOS VARIABLES (Por Evento/Plan)
       ========================================== */
    {
      name: 'eventParticipations',
      type: 'array',
      label: 'Eventos Asignados',
      fields: [
        {
          name: 'isCurrent',
          type: 'checkbox',
          label: '¿Es el evento actual?',
          defaultValue: false,
          admin: {
            hidden: true, // <-- CAMBIO CLAVE: Ya no estorba en la vista del Admin
          },
        },
        {
          name: 'event',
          type: 'relationship',
          relationTo: 'events',
          required: true,
          label: 'Evento Asignado',
        },
        {
          name: 'plan',
          type: 'relationship',
          relationTo: 'plans',
          required: true,
          label: 'Plan / Categoría',
        },

        {
          type: 'group',
          name: 'strategy',
          label: 'Estrategia de la Compañía',
          fields: [
            { name: 'description', type: 'textarea', label: 'Descripción' },
            { name: 'eventObjectives', type: 'textarea', label: 'Objetivos del Evento' },
            { name: 'brandDifferentiator', type: 'textarea', label: 'Diferenciador de Marca' },
          ],
        },

        {
          name: 'meetings',
          type: 'array',
          label: 'Reuniones de este Evento',
          fields: [
            { name: 'name', type: 'text', label: 'Nombre', admin: { readOnly: true } },
            {
              name: 'projectedMonth',
              type: 'text',
              label: 'Mes Proyectado',
              admin: { readOnly: true },
            },
            {
              name: 'calendlyLink',
              type: 'text',
              label: 'Link de Calendly',
              admin: { readOnly: true },
            },
            { name: 'platform', type: 'text', label: 'Plataforma', admin: { readOnly: true } },
            {
              name: 'status',
              type: 'select',
              defaultValue: 'pending',
              options: [
                { label: 'Pendiente', value: 'pending' },
                { label: 'Agendado', value: 'scheduled' },
                { label: 'Completado', value: 'completed' },
              ],
              label: 'Estado',
            },
            { name: 'scheduledDate', type: 'date', label: 'Fecha Agendada' },
          ],
        },

        {
          name: 'deliverables',
          type: 'array',
          label: 'Entregables (A subir por el Sponsor)',
          fields: [
            {
              name: 'benefitCategory',
              type: 'text',
              label: 'Categoría',
              admin: { readOnly: true },
            },
            { name: 'itemName', type: 'text', label: 'Entregable', admin: { readOnly: true } },
            {
              name: 'type',
              type: 'select',
              options: ['document', 'image', 'text', 'link', 'direct'],
              admin: { readOnly: true },
            },
            {
              name: 'status',
              type: 'select',
              defaultValue: 'pending',
              options: [
                { label: 'Pendiente', value: 'pending' },
                { label: 'Completado', value: 'completed' },
                { label: 'Vencido', value: 'overdue' },
              ],
              label: 'Estado',
            },
            { name: 'dueDate', type: 'date', label: 'Fecha Máxima', admin: { readOnly: true } },
            { name: 'uploadedFile', type: 'upload', relationTo: 'media', label: 'Archivo Subido' },
            { name: 'uploadedText', type: 'textarea', label: 'Texto Subido' },
            { name: 'uploadedLink', type: 'text', label: 'Link Subido' },
          ],
        },

        {
          name: 'benefitItems',
          type: 'array',
          label: 'Ejecución de Beneficios (Evidencias del Admin)',
          admin: {
            description:
              'Ítems heredados del plan. Sube evidencias aquí para marcarlos como completados.',
          },
          fields: [
            {
              name: 'benefitCategory',
              type: 'text',
              label: 'Categoría',
              admin: { readOnly: true },
            },
            { name: 'itemName', type: 'text', label: 'Ítem', admin: { readOnly: true } },
            {
              name: 'status',
              type: 'select',
              defaultValue: 'not_started',
              options: [
                { label: 'No Iniciado', value: 'not_started' },
                { label: 'En Progreso', value: 'in_progress' },
                { label: 'Completado', value: 'completed' },
              ],
              label: 'Estado',
            },
            {
              name: 'evidences',
              type: 'array',
              label: 'Evidencias Subidas',
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  required: true,
                  label: 'Tipo de Evidencia',
                  options: [
                    { label: 'Imagen', value: 'image' },
                    { label: 'Documento', value: 'document' },
                    { label: 'Texto', value: 'text' },
                    { label: 'Link', value: 'link' },
                  ],
                },
                {
                  name: 'file',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Archivo',
                  admin: {
                    condition: (_, siblingData) =>
                      ['image', 'document'].includes(siblingData?.type),
                  },
                },
                {
                  name: 'text',
                  type: 'textarea',
                  label: 'Texto / Descripción',
                  admin: { condition: (_, siblingData) => siblingData?.type === 'text' },
                },
                {
                  name: 'link',
                  type: 'text',
                  label: 'URL',
                  admin: { condition: (_, siblingData) => siblingData?.type === 'link' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  /* ==========================================
     EL CEREBRO (AUTOMATIZACIONES Y RESÚMENES)
     ========================================== */
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (!data.eventParticipations || data.eventParticipations.length === 0) {
          data.eventsSummary = 'Ninguno'
          data.currentPlanName = 'Ninguno'
          return data
        }

        // --- 1. LÓGICA AUTOMÁTICA DE EVENTO "ACTUAL" (MÁS PRÓXIMO) ---
        let futureEvents: { index: number; date: number }[] = []
        let pastEvents: { index: number; date: number }[] = []
        const now = new Date().getTime()

        for (let i = 0; i < data.eventParticipations.length; i++) {
          const participation = data.eventParticipations[i]
          if (participation.event) {
            const eventId =
              typeof participation.event === 'object' ? participation.event.id : participation.event
            try {
              const eventDoc = await req.payload.findByID({ collection: 'events', id: eventId })
              if (eventDoc?.startDate) {
                const startDate = new Date(eventDoc.startDate).getTime()
                if (startDate >= now) {
                  futureEvents.push({ index: i, date: startDate })
                } else {
                  pastEvents.push({ index: i, date: startDate })
                }
              }
            } catch (e) {
              console.error(e)
            }
          }
        }

        let currentIndex = -1
        if (futureEvents.length > 0) {
          futureEvents.sort((a, b) => a.date - b.date)
          currentIndex = futureEvents[0].index
        } else if (pastEvents.length > 0) {
          pastEvents.sort((a, b) => b.date - a.date)
          currentIndex = pastEvents[0].index
        }

        for (let i = 0; i < data.eventParticipations.length; i++) {
          data.eventParticipations[i].isCurrent = i === currentIndex
        }

        // --- 2. LÓGICA DE COLUMNAS PARA EL PANEL DE ADMIN ---
        let summaryArray: string[] = []
        let currentPlanName = 'Ninguno actual'

        for (let i = 0; i < data.eventParticipations.length; i++) {
          const participation = data.eventParticipations[i]

          if (participation.event) {
            const eventId =
              typeof participation.event === 'object' ? participation.event.id : participation.event
            try {
              const eventDoc = await req.payload.findByID({ collection: 'events', id: eventId })
              let eventName = eventDoc?.title || 'Evento desconocido'

              if (participation.isCurrent) {
                eventName += ' (actual)'

                if (participation.plan) {
                  const planId =
                    typeof participation.plan === 'object'
                      ? participation.plan.id
                      : participation.plan
                  const planDoc = await req.payload.findByID({ collection: 'plans', id: planId })
                  currentPlanName = planDoc?.name || 'Plan desconocido'
                }
              }
              summaryArray.push(eventName)
            } catch (e) {
              console.error(e)
            }
          }
        }

        data.eventsSummary = summaryArray.length > 0 ? summaryArray.join(', ') : 'Ninguno'
        data.currentPlanName = currentPlanName

        // --- 3. CLONACIÓN DE REUNIONES, ENTREGABLES Y ACTUALIZACIÓN DE ESTADOS ---
        for (let i = 0; i < data.eventParticipations.length; i++) {
          const participation = data.eventParticipations[i]

          // Clonar Reuniones
          if (
            participation.event &&
            (!participation.meetings || participation.meetings.length === 0)
          ) {
            try {
              const eventId =
                typeof participation.event === 'object'
                  ? participation.event.id
                  : participation.event
              const eventDoc = await req.payload.findByID({ collection: 'events', id: eventId })
              if (eventDoc?.meetingTemplates) {
                participation.meetings = eventDoc.meetingTemplates.map((template: any) => ({
                  name: template.name,
                  projectedMonth: template.projectedMonth,
                  calendlyLink: template.calendlyLink,
                  platform: template.platform,
                  status: 'pending',
                  scheduledDate: null,
                }))
              }
            } catch (e) {
              console.error(e)
            }
          }

          // Clonar Entregables e Ítems
          if (
            participation.plan &&
            (!participation.deliverables || participation.deliverables.length === 0) &&
            (!participation.benefitItems || participation.benefitItems.length === 0)
          ) {
            try {
              const planId =
                typeof participation.plan === 'object' ? participation.plan.id : participation.plan
              const planDoc = await req.payload.findByID({ collection: 'plans', id: planId })

              if (planDoc?.benefits) {
                const newDeliverables: any[] = []
                const newBenefitItems: any[] = []

                planDoc.benefits.forEach((benefit: any) => {
                  if (benefit.hasDeliverable && benefit.deliverables) {
                    benefit.deliverables.forEach((deliv: any) => {
                      newDeliverables.push({
                        benefitCategory: benefit.benefitName,
                        itemName: deliv.deliverableName,
                        type: deliv.type,
                        dueDate: deliv.dueDate,
                        status: 'pending',
                      })
                    })
                  }
                  if (benefit.items) {
                    benefit.items.forEach((item: any) => {
                      newBenefitItems.push({
                        benefitCategory: benefit.benefitName,
                        itemName: item.itemName,
                        status: 'not_started',
                      })
                    })
                  }
                })
                participation.deliverables = newDeliverables
                participation.benefitItems = newBenefitItems
              }
            } catch (e) {
              console.error(e)
            }
          }

          // Actualización de Estados
          if (participation.meetings) {
            participation.meetings.forEach((meeting: any) => {
              if (meeting.scheduledDate && meeting.status === 'pending') {
                meeting.status = 'scheduled'
              }
            })
          }

          if (participation.benefitItems) {
            participation.benefitItems.forEach((item: any) => {
              if (item.evidences && item.evidences.length > 0) {
                item.status = 'completed'
              }
            })
          }
        }

        return data
      },
    ],
  },
}
