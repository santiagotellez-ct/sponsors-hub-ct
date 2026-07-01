import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'

const syncToSponsors: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const { payload } = req

  const toId = (s: any) => (typeof s === 'object' && s !== null ? String(s.id) : String(s))

  const prevSponsors: string[] = (previousDoc?.sponsors || []).map(toId)
  const newSponsors: string[] = (doc?.sponsors || []).map(toId)

  const added = newSponsors.filter((id) => !prevSponsors.includes(id))
  const removed = prevSponsors.filter((id) => !newSponsors.includes(id))
  const unchanged = newSponsors.filter((id) => prevSponsors.includes(id))

  const resourceId = String(doc.id)
  const fileId =
    doc.tipo === 'archivo' && doc.file
      ? typeof doc.file === 'object'
        ? doc.file.id
        : doc.file
      : undefined

  // Añadir el recurso a los sponsors recién asignados
  for (const sponsorId of added) {
    try {
      const sponsor = await payload.findByID({ collection: 'sponsors', id: sponsorId, depth: 0 })
      const existingDocs: any[] = sponsor.documents || []
      if (existingDocs.some((d) => d.recursoGlobalId === resourceId)) continue

      await payload.update({
        collection: 'sponsors',
        id: sponsorId,
        data: {
          documents: [
            ...existingDocs,
            {
              name: doc.nombre,
              tipo: doc.tipo,
              ...(fileId ? { file: fileId } : {}),
              ...(doc.tipo === 'url' ? { url: doc.url } : {}),
              recursoGlobalId: resourceId,
            },
          ],
        },
      })
    } catch (e) {
      console.error(`[RecursosGlobales] Error al asignar recurso al sponsor ${sponsorId}:`, e)
    }
  }

  // Eliminar el recurso de los sponsors que fueron removidos
  for (const sponsorId of removed) {
    try {
      const sponsor = await payload.findByID({ collection: 'sponsors', id: sponsorId, depth: 0 })
      const existingDocs: any[] = sponsor.documents || []
      const filtered = existingDocs.filter((d) => d.recursoGlobalId !== resourceId)
      if (filtered.length === existingDocs.length) continue

      await payload.update({
        collection: 'sponsors',
        id: sponsorId,
        data: { documents: filtered },
      })
    } catch (e) {
      console.error(`[RecursosGlobales] Error al remover recurso del sponsor ${sponsorId}:`, e)
    }
  }

  // Actualizar el recurso en sponsors que ya estaban asignados (si cambió nombre/archivo/url)
  for (const sponsorId of unchanged) {
    try {
      const sponsor = await payload.findByID({ collection: 'sponsors', id: sponsorId, depth: 0 })
      const existingDocs: any[] = sponsor.documents || []
      const idx = existingDocs.findIndex((d) => d.recursoGlobalId === resourceId)
      if (idx === -1) continue

      const updated = [...existingDocs]
      updated[idx] = {
        ...updated[idx],
        name: doc.nombre,
        tipo: doc.tipo,
        ...(fileId ? { file: fileId } : { file: null }),
        url: doc.tipo === 'url' ? doc.url : null,
      }

      await payload.update({
        collection: 'sponsors',
        id: sponsorId,
        data: { documents: updated },
      })
    } catch (e) {
      console.error(`[RecursosGlobales] Error al actualizar recurso en sponsor ${sponsorId}:`, e)
    }
  }

  return doc
}

export const RecursosGlobales: CollectionConfig = {
  slug: 'recursos-globales',
  admin: {
    useAsTitle: 'nombre',
    group: 'Configuración',
    defaultColumns: ['nombre', 'tipo', 'sponsors', 'createdAt'],
    description: 'Recursos compartidos que se asignan a uno o varios sponsors a la vez.',
  },
  hooks: {
    afterChange: [syncToSponsors],
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      label: 'Nombre del Recurso',
    },
    {
      name: 'descripcion',
      type: 'textarea',
      label: 'Descripción (opcional)',
    },
    {
      name: 'tipo',
      type: 'select',
      label: 'Tipo',
      defaultValue: 'archivo',
      required: true,
      options: [
        { label: 'Archivo', value: 'archivo' },
        { label: 'URL / Enlace', value: 'url' },
      ],
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'Archivo',
      admin: {
        condition: (_, siblingData) => !siblingData?.tipo || siblingData?.tipo === 'archivo',
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'URL del Enlace',
      admin: {
        condition: (_, siblingData) => siblingData?.tipo === 'url',
        description: 'Introduce la URL completa (ej: https://drive.google.com/...)',
      },
    },
    {
      name: 'sponsors',
      type: 'relationship',
      relationTo: 'sponsors',
      hasMany: true,
      label: 'Asignar a Sponsors',
      admin: {
        description:
          'Selecciona los sponsors. El recurso se añadirá automáticamente en su sección de Recursos.',
      },
    },
  ],
}
