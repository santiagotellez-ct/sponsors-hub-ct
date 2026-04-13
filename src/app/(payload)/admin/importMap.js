import { PayloadIcon as PayloadIcon_9d9cb0c39b863347f00f30cfa4fb88cd } from '@/components/payload-logo'
import { PayloadLogo as PayloadLogo_9d9cb0c39b863347f00f30cfa4fb88cd } from '@/components/payload-logo'
import { DashboardGreeting as DashboardGreeting_17d11ec5e57c18e809bc18ec79e326ac } from '@/components/dashboard-greeting'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

export const importMap = {
  "@/components/payload-logo#PayloadIcon": PayloadIcon_9d9cb0c39b863347f00f30cfa4fb88cd,
  "@/components/payload-logo#PayloadLogo": PayloadLogo_9d9cb0c39b863347f00f30cfa4fb88cd,
  "@/components/dashboard-greeting#DashboardGreeting": DashboardGreeting_17d11ec5e57c18e809bc18ec79e326ac,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
