import type { CollectionConfig } from 'payload'

export const SponsorArticles: CollectionConfig = {
  slug: 'sponsor-articles',
  admin: {
    useAsTitle: 'datoImpactante',
    group: 'Gestión de Patrocinadores',
    defaultColumns: ['sponsor', 'event', 'status', 'publishedAt'],
  },
  fields: [
    {
      name: 'sponsor',
      type: 'relationship',
      relationTo: 'sponsors',
      required: true,
      label: 'Sponsor',
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      label: 'Evento',
    },
    {
      name: 'datoImpactante',
      type: 'text',
      required: true,
      label: 'Dato Impactante',
      admin: {
        description: 'La cita/dato que se muestra sobre la imagen.',
      },
    },
    {
      name: 'articuloCorto',
      type: 'richText',
      label: 'Artículo Corto',
      admin: {
        description: 'El copy del onepager, no se muestra sobre la imagen.',
      },
    },
    {
      name: 'imagen',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen Final',
      admin: {
        description: 'El PNG final exportado.',
      },
    },
    {
      name: 'imageSource',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen Original',
      admin: {
        description: 'La foto original subida, antes del recorte/zoom.',
      },
    },
    {
      name: 'imageCrop',
      type: 'json',
      label: 'Recorte de Imagen',
      admin: {
        description: 'Guarda {x, y, zoom} del editor de recorte.',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      defaultValue: 'draft',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Publicado', value: 'published' },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Fecha de Publicación',
    },
    {
      name: 'companyName',
      type: 'text',
      label: 'Nombre de la Empresa (copia)',
      admin: {
        readOnly: true,
        description: 'Denormalizado desde el sponsor para lectura pública.',
      },
    },
    {
      name: 'logoUrl',
      type: 'text',
      label: 'URL del Logo (copia)',
      admin: {
        readOnly: true,
        description: 'Denormalizado desde el sponsor para lectura pública.',
      },
    },
    {
      name: 'tier',
      type: 'text',
      label: 'Tier (copia)',
      admin: {
        readOnly: true,
        description: 'Denormalizado desde el sponsor para lectura pública.',
      },
    },
    {
      name: 'imagenUrl',
      type: 'text',
      label: 'URL de Imagen Final (copia)',
      admin: {
        readOnly: true,
        description: 'Denormalizado desde el media de la imagen final para lectura pública.',
      },
    },
    {
      name: 'articuloTexto',
      type: 'textarea',
      label: 'Artículo (texto plano, copia)',
      admin: {
        readOnly: true,
        description: 'Copia en texto plano del artículo corto, para lectura pública.',
      },
    },
  ],
}
