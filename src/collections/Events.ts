import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Título del Evento',
    },
    {
      type: 'row',
      fields: [
        { name: 'startDate', type: 'date', required: true, label: 'Fecha de Inicio' },
        { name: 'endDate', type: 'date', required: true, label: 'Fecha de Finalización' },
      ],
    },

    /* ==========================================
       IDENTIDAD VISUAL DEL EVENTO
       ========================================== */
    {
      type: 'row',
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo del Evento' },
        {
          name: 'backgroundImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Imagen de Fondo (Cards)',
        },
      ],
    },

    /* ==========================================
       CALENDARIO / JOURNEY DEL EVENTO
       ========================================== */
    {
      name: 'journey',
      type: 'group',
      label: 'Calendario / Journey del Evento',
      admin: {
        description:
          'Configura el único calendario de este evento, añadiendo sus diferentes momentos e ítems.',
      },
      fields: [
        {
          name: 'moments',
          type: 'array',
          label: 'Momentos del Journey',
          labels: { singular: 'Momento', plural: 'Momentos' },
          fields: [
            {
              name: 'momentTitle',
              type: 'text',
              required: true,
              label: 'Título del Momento',
            },
            {
              name: 'items',
              type: 'array',
              label: 'Ítems del Momento',
              labels: { singular: 'Ítem', plural: 'Ítems' },
              fields: [
                { name: 'itemTitle', type: 'text', required: true, label: 'Título del Ítem' },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'date1',
                      type: 'date',
                      required: true,
                      label: 'Fecha 1 (Inicio/Activación)',
                    },
                    { name: 'date2', type: 'date', label: 'Fecha 2 (Fin - Opcional)' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    /* ==========================================
       PLANTILLAS DE REUNIONES
       ========================================== */
    {
      name: 'meetingTemplates',
      type: 'array',
      label: 'Reuniones / Sesiones (Plantilla)',
      admin: {
        description: 'Estas reuniones se clonarán al Sponsor cuando se le asigne este evento.',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Nombre de la Reunión (Ej. Kick Off)',
        },
        {
          name: 'projectedMonth',
          type: 'text',
          label: 'Mes Proyectado',
          admin: { description: 'Ej: "Octubre 2026" o un selector de fecha referencial.' },
        },
        { name: 'calendlyLink', type: 'text', label: 'Link de Calendly (Embed)' },
        { name: 'platform', type: 'text', label: 'Lugar / Proyección (Ej. Google Meet, Zoom)' },
      ],
    },
  ],

  /* ==========================================
     EL MEGÁFONO DE PROPAGACIÓN
     ========================================== */
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        try {
          // 1. Buscamos a todos los sponsors que tengan este evento asignado
          const sponsorsToUpdate = await req.payload.find({
            collection: 'sponsors',
            where: {
              'eventParticipations.event': {
                equals: doc.id,
              },
            },
            depth: 0,
            limit: 1000,
          })

          // 2. Les damos un "toque" forzando un guardado para que su propio Hook
          // recalcule si este evento sigue siendo el "Actual" basado en la nueva fecha
          for (const sponsor of sponsorsToUpdate.docs) {
            await req.payload.update({
              collection: 'sponsors',
              id: sponsor.id,
              data: {
                companyName: sponsor.companyName, // Reenviamos el nombre para forzar el trigger
              },
              req,
            })
          }
        } catch (error) {
          console.error('Error al propagar actualización del evento a los sponsors:', error)
        }
      },
    ],
  },
}
