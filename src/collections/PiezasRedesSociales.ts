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
      name: 'archivo',
      type: 'upload',
      relationTo: 'media',
      label: 'Archivo (Imagen o PDF)',
      admin: {
        description: 'Sube aquí la imagen o PDF. Deja vacío si el formato es Link.',
      },
    },
    {
      name: 'urlLink',
      type: 'text',
      label: 'URL del Link',
      admin: {
        description: 'Solo para formato Link. Deja vacío si subiste un archivo.',
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
