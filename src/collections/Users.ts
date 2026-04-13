import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Sistema y Archivos',
  },
  auth: true,
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
