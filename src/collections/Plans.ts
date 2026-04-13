import type { CollectionConfig } from 'payload'

export const Plans: CollectionConfig = {
  slug: 'plans',
  admin: {
    useAsTitle: 'name',
    group: 'Configuración',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre del Plan / Tier',
    },
    {
      name: 'addonsDiscount',
      type: 'number',
      label: '% de Descuento en Add-ons',
    },
    {
      name: 'benefits',
      type: 'array',
      label: 'Beneficios',
      labels: { singular: 'Beneficio', plural: 'Beneficios' },
      fields: [
        {
          name: 'benefitName',
          type: 'text',
          required: true,
          label: 'Categoría de Beneficio',
        },
        {
          name: 'hasDeliverable',
          type: 'checkbox',
          label: '¿Este beneficio exige uno o más entregables?',
          defaultValue: false,
        },
        {
          name: 'deliverables',
          type: 'array',
          label: 'Entregables Exigidos',
          admin: {
            condition: (data, siblingData) => siblingData?.hasDeliverable === true,
          },
          fields: [
            {
              name: 'deliverableName',
              type: 'text',
              required: true,
              label: 'Nombre del Entregable',
            },
            {
              name: 'type',
              type: 'select',
              required: true,
              label: 'Tipo de Entregable',
              options: [
                { label: 'Archivo / Media (imagen, PDF, SVG)', value: 'document' },
                { label: 'Imagen', value: 'image' },
                { label: 'Texto', value: 'text' },
                { label: 'Enlace / URL', value: 'link' }, // NUEVO TIPO AGREGADO
                { label: 'Comunicación Directa', value: 'direct' },
              ],
            },
            { name: 'dueDate', type: 'date', required: true, label: 'Fecha Máxima' },
          ],
        },
        {
          name: 'items',
          type: 'array',
          label: 'Items del Beneficio',
          labels: { singular: 'Item', plural: 'Items' },
          fields: [{ name: 'itemName', type: 'text', required: true, label: 'Nombre del Item' }],
        },
      ],
    },
  ],
}
