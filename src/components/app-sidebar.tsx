'use client'

import * as React from 'react'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  LayoutDashboardIcon,
  CheckSquareIcon,
  CalendarDaysIcon,
  CalendarIcon,
  PackageIcon,
  FileTextIcon,
} from 'lucide-react'

export function AppSidebar({
  sponsor,
  ...props
}: React.ComponentProps<typeof Sidebar> & { sponsor?: any }) {
  const sponsorName = sponsor?.companyName || 'Empresa Sponsor'
  const sponsorEmail = sponsor?.contactInfo?.corporateEmail || 'correo@empresa.com'
  const sponsorLogoUrl = typeof sponsor?.logo === 'object' ? sponsor?.logo?.url : ''

  const data = {
    user: {
      name: sponsorName,
      email: sponsorEmail,
      avatar: sponsorLogoUrl,
    },
    navMain: [
      { title: 'Dashboard', url: '/dashboard', icon: <LayoutDashboardIcon /> },
      { title: 'Entregables', url: '/dashboard/entregables', icon: <CheckSquareIcon /> },
      { title: 'Reuniones', url: '/dashboard/reuniones', icon: <CalendarDaysIcon /> },
      { title: 'Calendario', url: '/dashboard/calendario', icon: <CalendarIcon /> },
      { title: 'Mis Planes', url: '/dashboard/planes', icon: <PackageIcon /> },
      { title: 'Documentos', url: '/dashboard/documentos', icon: <FileTextIcon /> },
    ],
  }

  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 overflow-hidden">
                  <img
                    src="/icon-colombia-tech.png"
                    alt="Colombia Tech"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">Colombia Tech</span>
                  <span className="truncate text-xs text-muted-foreground">Sponsor Hub</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} sponsor={sponsor} />
      </SidebarFooter>
    </Sidebar>
  )
}
