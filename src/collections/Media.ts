import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true,
  access: {
    read: () => true, // Para que el frontend pueda leer los archivos
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: 'Se autocompleta con el nombre del archivo si se deja en blanco.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Si el campo alt está vacío y hay un archivo subiéndose
        if (!data.alt && data.filename) {
          const filename = data.filename as string
          // Removemos la extensión del archivo (ej. 'logo-empresa.png' -> 'logo-empresa')
          const nameWithoutExt = filename.split('.').slice(0, -1).join('.') || filename
          data.alt = nameWithoutExt
        }
        return data
      },
    ],
  },
}
