// Server Component — wraps content in the Payload admin layout (sidebar + header)
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { ArticulosClient } from './ArticulosClient'

export const ArticulosView: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
}) => {
  const { req, permissions, visibleEntities, locale } = initPageResult

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      visibleEntities={visibleEntities}
    >
      <ArticulosClient />
    </DefaultTemplate>
  )
}
