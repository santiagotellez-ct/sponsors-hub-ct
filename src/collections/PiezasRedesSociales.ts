import type { CollectionConfig } from 'payload'

export const PiezasRedesSociales: CollectionConfig = {
  slug: 'piezas-redes-sociales',
  admin: {
    useAsTitle: 'nombre',
    group: 'Configuración',
    defaultColumns: ['nombre', 'formatoTipo', 'fechaPublicacion'],
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
