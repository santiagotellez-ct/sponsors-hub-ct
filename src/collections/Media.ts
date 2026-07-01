import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Sistema y Archivos',
  },
  upload: {
    mimeTypes: [
      'image/*',
      'application/pdf',
      'application/postscript',
      'application/illustrator',
      'application/vnd.adobe.illustrator',
      // Documentos Office
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Otros
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
    ],
  },
  access: {
    read: () => true,
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
    beforeOperation: [
      ({ args, operation }) => {
        if ((operation === 'create' || operation === 'update') && args.req?.file?.name) {
          const original = args.req.file.name as string
          const dotIndex = original.lastIndexOf('.')
          const ext = dotIndex !== -1 ? original.slice(dotIndex + 1) : ''
          const nameWithoutExt = dotIndex !== -1 ? original.slice(0, dotIndex) : original

          // Supabase S3 rejects filenames with special/unicode characters (ñ, ×, ·, spaces, etc.)
          const sanitized = nameWithoutExt
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase()

          args.req.file.name = ext ? `${sanitized}.${ext}` : sanitized
        }
        return args
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (!data.alt && data.filename) {
          const filename = data.filename as string
          const nameWithoutExt = filename.split('.').slice(0, -1).join('.') || filename
          data.alt = nameWithoutExt
        }
        return data
      },
    ],
  },
}
