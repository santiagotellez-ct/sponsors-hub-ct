import type { CollectionConfig } from 'payload'

export const PiezasRedesSociales: CollectionConfig = {
  slug: 'piezas-redes-sociales',
  upload: {
    mimeTypes: [
      'image/*',
      'application/pdf',
      'image/svg+xml',
    ],
  },
  admin: {
    useAsTitle: 'nombre',
    group: 'Configuración',
    defaultColumns: ['nombre', 'formatoTipo', 'fechaPublicacion'],
    description: 'Para piezas de tipo Imagen o PDF sube el archivo aquí. Para links deja el archivo vacío y rellena el campo URL.',
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      label: 'Nombre de la Pieza',
    },
    {
      name: 'formatoTipo',
      type: 'select',
      label: 'Tipo de Formato',
      defaultValue: 'imagen',
      required: true,
      options: [
        { label: 'Imagen (PNG, SVG, JPG, etc.)', value: 'imagen' },
        { label: 'PDF', value: 'pdf' },
        { label: 'Link', value: 'link' },
      ],
    },
    {
      name: 'urlLink',
      type: 'text',
      label: 'URL del Link',
      admin: {
        description: 'Solo para formato Link.',
      },
    },
    {
      name: 'fechaPublicacion',
      type: 'date',
      label: 'Fecha Sugerida de Publicación',
    },
    {
      name: 'copySugerido',
      type: 'textarea',
      label: 'Copy Sugerido',
    },
  ],
}
