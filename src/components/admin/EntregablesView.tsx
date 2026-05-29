// Server Component — wraps content in the Payload admin layout (sidebar + header)
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { EntregablesViewClient } from './EntregablesViewClient'

export const EntregablesView: React.FC<AdminViewServerProps> = ({
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
      <EntregablesViewClient />
    </DefaultTemplate>
  )
}
