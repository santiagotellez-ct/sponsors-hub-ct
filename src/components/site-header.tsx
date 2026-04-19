'use client'

import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'
import { PanelLeftIcon } from 'lucide-react'

const SECTION_LABELS: Record<string, string> = {
  dashboard: 'General',
  entregables: 'Entregables',
  reuniones: 'Reuniones',
  calendario: 'Calendario',
  planes: 'Mis planes',
  documentos: 'Documentos',
}

export function SiteHeader({ sponsor }: { sponsor?: any }) {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()

  const userName = sponsor?.contactInfo?.fullName || 'Usuario'
  const firstName = userName.split(' ')[0]
  const initial = firstName.charAt(0).toUpperCase()

  const pathSegments = pathname.split('/').filter(Boolean)
  const lastSegment = pathSegments[pathSegments.length - 1] || 'dashboard'
  const currentSection = SECTION_LABELS[lastSegment] || (lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1))

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background/95 backdrop-blur-sm">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        {/* Sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
        >
          <PanelLeftIcon className="w-4 h-4" />
        </button>

        <Separator orientation="vertical" className="mr-1 data-vertical:h-4 data-vertical:self-auto" />

        {/* Breadcrumb */}
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground text-[13px]"
              >
                Sponsor Hub
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[13px] font-medium text-foreground">
                {currentSection}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Right side: bell + user */}
        <div className="ml-auto flex items-center gap-3 shrink-0">

          {/* Avatar + nombre */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-primary-foreground leading-none">{initial}</span>
            </div>
            <span className="text-[13.5px] font-medium text-foreground truncate max-w-[120px]">
              {firstName}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
