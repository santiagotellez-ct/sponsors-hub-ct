import type { CollectionConfig } from 'payload'
import { Resend } from 'resend'
import WelcomeEmail from '../emails/WelcomeEmail'
import EvidenceUploadedEmail from '../emails/EvidenceUploadedEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  admin: {
    useAsTitle: 'companyName',
    group: 'Gestión de Patrocinadores',
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
            hidden: true,
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
            { name: 'platform', type: 'text', label: 'Link de Reunión / Plataforma' },
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
    // 1. EL HOOK AFTER: Aquí enviamos el correo leyendo el contexto
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        // 1. CORREO DE BIENVENIDA (Cuando se crea)
        if (operation === 'create') {
          try {
            const rawPassword = req.context.rawPassword as string
            const contactEmail = doc.contactInfo?.corporateEmail || doc.email

            if (contactEmail && rawPassword) {
              await resend.emails.send({
                from: 'Colombia Tech <onboarding@resend.dev>',
                to: contactEmail,
                subject: 'Tus credenciales de acceso | Sponsors Hub',
                react: WelcomeEmail({
                  companyName: doc.companyName,
                  email: contactEmail,
                  passwordTemp: rawPassword,
                }),
              })
              console.log(`Correo de bienvenida enviado a ${contactEmail}`)
            }
          } catch (error) {
            console.error('Error enviando el correo de bienvenida:', error)
          }
        }

        // 2. CORREO DE EVIDENCIA (Cuando se actualiza)
        if (operation === 'update' && previousDoc) {
          try {
            const contactEmail = doc.contactInfo?.corporateEmail || doc.email
            if (!contactEmail) return

            const currentParticipations = doc.eventParticipations || []
            const prevParticipations = previousDoc.eventParticipations || []

            // Buscamos si hay evidencias nuevas
            let newEvidenceFound = null

            for (let i = 0; i < currentParticipations.length; i++) {
              const currentPart = currentParticipations[i]
              const prevPart = prevParticipations[i] // Asumimos el mismo orden

              if (!prevPart) continue

              const currentItems = currentPart.benefitItems || []
              const prevItems = prevPart.benefitItems || []

              for (let j = 0; j < currentItems.length; j++) {
                const currentItem = currentItems[j]
                // Buscamos el ítem equivalente en el documento anterior
                const prevItem =
                  prevItems.find((pi: any) => pi.id === currentItem.id) || prevItems[j]

                const currentEvidencesCount = currentItem.evidences?.length || 0
                const prevEvidencesCount = prevItem?.evidences?.length || 0

                // Si ahora hay MÁS evidencias que antes, encontramos el cambio
                if (currentEvidencesCount > prevEvidencesCount) {
                  newEvidenceFound = currentItem
                  break // Con una que encontremos es suficiente para notificar
                }
              }
              if (newEvidenceFound) break
            }

            // Si encontramos una evidencia nueva, disparamos el correo
            if (newEvidenceFound) {
              await resend.emails.send({
                from: 'Colombia Tech <notificaciones@resend.dev>',
                to: contactEmail,
                subject: 'Nueva evidencia en tu patrocinio | Sponsors Hub',
                react: EvidenceUploadedEmail({
                  companyName: doc.companyName,
                  itemName: newEvidenceFound.itemName,
                  benefitCategory: newEvidenceFound.benefitCategory,
                }),
              })
              console.log(
                `Correo de evidencia enviado a ${contactEmail} por el item: ${newEvidenceFound.itemName}`,
              )
            }
          } catch (error) {
            console.error('Error enviando el correo de evidencia:', error)
          }
        }

        // 3. WEBHOOK HACIA N8N (Sincronización con Notion)
        if (
          operation === 'update' &&
          doc.contactInfo?.fullName &&
          doc.eventParticipations?.length > 0
        ) {
          const webhookUrl = process.env.N8N_WEBHOOK_URL

          if (webhookUrl) {
            try {
              // Buscamos la participación activa para extraer su estrategia
              const activeParticipation =
                doc.eventParticipations.find((p: any) => p.isCurrent) || doc.eventParticipations[0]

              // Extraemos los nombres de todos los eventos y planes asignados
              const assignedEvents = doc.eventParticipations
                .map((p: any) => (typeof p.event === 'object' ? p.event?.title : p.event))
                .filter(Boolean)
              const assignedPlans = doc.eventParticipations
                .map((p: any) => (typeof p.plan === 'object' ? p.plan?.name : p.plan))
                .filter(Boolean)

              const payloadToN8n = {
                sponsorId: doc.id,
                companyName: doc.companyName,
                emailCorporate: doc.contactInfo?.corporateEmail || doc.email,
                emailUser: doc.email,
                contactName: doc.contactInfo.fullName,
                whatsapp: doc.contactInfo.whatsapp,
                linkedin: doc.contactInfo.linkedin,
                events: assignedEvents,
                plans: assignedPlans,
                strategyDescription: activeParticipation?.strategy?.description || 'Sin definir',
                strategyObjectives: activeParticipation?.strategy?.eventObjectives || 'Sin definir',
                strategyDifferentiator:
                  activeParticipation?.strategy?.brandDifferentiator || 'Sin definir',
                // Construimos la URL pública del logo apuntando a Vercel
                logoUrl: doc.logo?.url ? `https://sponsors-hub-ct.vercel.app${doc.logo.url}` : null,
              }

              // Disparamos el webhook con await para no bloquear Vercel
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadToN8n),
              })

              console.log(`Sincronización a n8n enviada para ${doc.companyName}`)
            } catch (error) {
              console.log('Error enviando webhook a n8n, pero el sponsor fue guardado.', error)
            }
          }
        }
      },
    ],
    // 2. EL HOOK BEFORE: Aquí procesamos la lógica y atrapamos la contraseña
    beforeChange: [
      async ({ data, req, operation }) => {
        // ---> NUEVO: Atrapamos la contraseña cruda antes de que se encripte
        if (operation === 'create' && data.password) {
          req.context.rawPassword = data.password
        }

        if (!data.eventParticipations || data.eventParticipations.length === 0) {
          data.eventsSummary = 'Ninguno'
          data.currentPlanName = 'Ninguno'
          return data
        }

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

        for (let i = 0; i < data.eventParticipations.length; i++) {
          const participation = data.eventParticipations[i]

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
