import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Colecciones
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Events } from './collections/Events'
import { Sponsors } from './collections/Sponsors'
import { Plans } from './collections/Plans'

// Plugin de S3
import { s3Storage } from '@payloadcms/storage-s3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- Colombia Tech',
      icons: [
        {
          rel: 'icon',
          type: 'image/png',
          url: '/icon-colombia-tech.png',
        },
      ],
    },
    components: {
      graphics: {
        Logo: '@/components/payload-logo#PayloadLogo',
        Icon: '@/components/payload-logo#PayloadIcon',
      },
      beforeDashboard: ['@/components/dashboard-greeting#DashboardGreeting'],
    },
  },
  collections: [Users, Media, Sponsors, Events, Plans],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: true, // Esto conecta tu colección Media directamente con Supabase
      },
      bucket: process.env.S3_BUCKET as string,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
        },
        region: process.env.S3_REGION as string,
        endpoint: process.env.S3_ENDPOINT as string,
        forcePathStyle: true, // OBLIGATORIO para que funcione con Supabase
      },
    }),
  ],
})
