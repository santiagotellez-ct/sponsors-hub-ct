import type { CollectionConfig } from 'payload'

export const RecursosGlobales: CollectionConfig = {
  slug: 'recursos-globales',
  admin: {
    useAsTitle: 'nombre',
    group: 'Configuración',
    defaultColumns: ['nombre', 'tipo', 'sponsors', 'createdAt'],
    description: 'Recursos compartidos que se asignan a uno o varios sponsors a la vez.',
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
          'Selecciona los sponsors que verán este recurso en su sección de Recursos. El recurso aparecerá automáticamente en su dashboard.',
      },
    },
  ],
}
