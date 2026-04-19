import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { EntregablesView } from '@/components/entregables-view'

export const description = 'Roadmap de Entregables del Sponsor'

export default async function EntregablesPage() {
  const payload = await getPayload({ config: configPromise })
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) redirect('/')

  const { user } = await payload.auth({
    headers: new Headers({ Authorization: `JWT ${token}` }),
  })

  if (!user || user.collection !== 'sponsors') redirect('/')

  // Pedimos depth: 2 para traer toda la info anidada del Plan y sus Beneficios
  const sponsor = await payload.findByID({
    collection: 'sponsors',
    id: user.id,
    depth: 2,
  })

  return (
    <TooltipProvider>
      <div className="[--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <SiteHeader sponsor={sponsor} />
          <div className="flex flex-1">
            <AppSidebar sponsor={sponsor} />
            <SidebarInset>
              <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 max-w-5xl mx-auto w-full">
                <EntregablesView sponsor={sponsor} />
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </TooltipProvider>
  )
}
