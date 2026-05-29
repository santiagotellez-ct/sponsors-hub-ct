import type { CollectionConfig } from 'payload'

const toFieldKey = (label: string): string =>
  label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40)

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    useAsTitle: 'title',
    group: 'Configuración',
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (Array.isArray(data.fields)) {
          data.fields = data.fields.map((field: any) => {
            // Auto-generate fieldKey from label only if not already set
            if (!field.fieldKey && field.label) {
              field.fieldKey = toFieldKey(field.label)
            }
            return field
          })
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Título del Formulario',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción / Instrucciones para el sponsor',
    },
    {
      name: 'referenceTitle',
      type: 'text',
      label: 'Título de la referencia visual',
      admin: {
        description: 'Ej: "Así se verá tu video en el evento". Se muestra al sponsor antes de los campos del formulario.',
      },
    },
    {
      name: 'referenceImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen de referencia',
      admin: {
        description: 'El sponsor verá una miniatura clicable que abre la imagen a pantalla completa.',
      },
    },
    {
      name: 'referencePdf',
      type: 'upload',
      relationTo: 'media',
      label: 'PDF de referencia',
      admin: {
        description: 'Se abrirá en una nueva pestaña al hacer clic.',
      },
    },
    {
      name: 'referenceLink',
      type: 'text',
      label: 'Link de referencia',
      admin: {
        description: 'URL de ejemplo. Se muestra como botón al sponsor.',
      },
    },
    {
      name: 'fields',
      type: 'array',
      label: 'Campos',
      labels: { singular: 'Campo', plural: 'Campos' },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Etiqueta visible',
        },
        {
          // Auto-generated from label, never shown in admin
          name: 'fieldKey',
          type: 'text',
          admin: { hidden: true },
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          label: 'Tipo de Campo',
          options: [
            { label: 'Texto corto', value: 'text' },
            { label: 'Texto largo', value: 'textarea' },
            { label: 'Número', value: 'number' },
            { label: 'Fecha', value: 'date' },
            { label: 'Selector (opciones)', value: 'select' },
            { label: 'Casilla de verificación', value: 'checkbox' },
            { label: 'Imagen', value: 'image' },
            { label: 'Enlace / URL', value: 'link' },
            { label: 'Correo electrónico', value: 'email' },
          ],
        },
        {
          name: 'required',
          type: 'checkbox',
          label: '¿Campo obligatorio?',
          defaultValue: false,
        },
        {
          name: 'placeholder',
          type: 'text',
          label: 'Texto de ayuda (placeholder)',
        },
        {
          name: 'options',
          type: 'array',
          label: 'Opciones del Selector',
          labels: { singular: 'Opción', plural: 'Opciones' },
          admin: {
            condition: (_data, siblingData) => siblingData?.type === 'select',
          },
          fields: [
            {
              name: 'optionLabel',
              type: 'text',
              required: true,
              label: 'Etiqueta',
            },
            {
              name: 'optionValue',
              type: 'text',
              required: true,
              label: 'Valor',
            },
          ],
        },
      ],
    },
  ],
}
