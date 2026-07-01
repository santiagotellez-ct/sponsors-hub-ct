import type { CollectionConfig, CollectionAfterChangeHook, BasePayload } from 'payload'

async function doSyncSponsors(doc: any, previousDoc: any, payload: BasePayload) {
  const toId = (s: any) => (typeof s === 'object' && s !== null ? String(s.id) : String(s))

  const prevSponsors: string[] = (previousDoc?.sponsors || []).map(toId)
  const newSponsors: string[] = (doc?.sponsors || []).map(toId)

  const added = newSponsors.filter((id) => !prevSponsors.includes(id))
  const removed = prevSponsors.filter((id) => !newSponsors.includes(id))
  const unchanged = newSponsors.filter((id) => prevSponsors.includes(id))

  console.log(`[RecursosGlobales] sync — added: [${added}], removed: [${removed}]`)

  const resourceId = String(doc.id)
  const fileId =
    doc.tipo === 'archivo' && doc.file
      ? typeof doc.file === 'object'
        ? doc.file.id
        : doc.file
      : undefined

  for (const sponsorId of added) {
    try {
      const sponsor = await payload.findByID({
        collection: 'sponsors',
        id: sponsorId,
        depth: 0,
        overrideAccess: true,
      })
      const existingDocs: any[] = (sponsor.documents as any[]) || []
      if (existingDocs.some((d: any) => d.recursoGlobalId === resourceId)) continue

      await payload.update({
        collection: 'sponsors',
        id: sponsorId,
        overrideAccess: true,
        // Evita disparar el afterChange de Sponsors (emails / N8N webhook)
        context: { skipNotifications: true },
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
      console.log(`[RecursosGlobales] ✓ recurso añadido al sponsor ${sponsorId}`)
    } catch (e) {
      console.error(`[RecursosGlobales] ERROR al asignar al sponsor ${sponsorId}:`, e)
    }
  }

  for (const sponsorId of removed) {
    try {
      const sponsor = await payload.findByID({
        collection: 'sponsors',
        id: sponsorId,
        depth: 0,
        overrideAccess: true,
      })
      const existingDocs: any[] = (sponsor.documents as any[]) || []
      const filtered = existingDocs.filter((d: any) => d.recursoGlobalId !== resourceId)
      if (filtered.length === existingDocs.length) continue

      await payload.update({
        collection: 'sponsors',
        id: sponsorId,
        overrideAccess: true,
        context: { skipNotifications: true },
        data: { documents: filtered },
      })
      console.log(`[RecursosGlobales] ✓ recurso removido del sponsor ${sponsorId}`)
    } catch (e) {
      console.error(`[RecursosGlobales] ERROR al remover del sponsor ${sponsorId}:`, e)
    }
  }

  for (const sponsorId of unchanged) {
    try {
      const sponsor = await payload.findByID({
        collection: 'sponsors',
        id: sponsorId,
        depth: 0,
        overrideAccess: true,
      })
      const existingDocs: any[] = (sponsor.documents as any[]) || []
      const idx = existingDocs.findIndex((d: any) => d.recursoGlobalId === resourceId)
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
        overrideAccess: true,
        context: { skipNotifications: true },
        data: { documents: updated },
      })
    } catch (e) {
      console.error(`[RecursosGlobales] ERROR al actualizar en sponsor ${sponsorId}:`, e)
    }
  }
}

const syncToSponsors: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  // Correr fuera del ciclo actual para no bloquear el save ni disparar
  // el afterChange de Sponsors (emails + N8N webhook)
  setImmediate(() => {
    doSyncSponsors(doc, previousDoc, req.payload).catch((e) =>
      console.error('[RecursosGlobales] sync fatal:', e),
    )
  })
  // Retorno síncrono: el save de RecursosGlobales termina inmediatamente
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
