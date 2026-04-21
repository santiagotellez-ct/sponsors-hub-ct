'use client'

import { usePathname } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { LockIcon } from 'lucide-react'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    locked?: boolean
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10.5px] font-bold tracking-[0.1em] text-muted-foreground/60 uppercase px-2 mb-1">
        Menú Principal
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const isActive =
            pathname === item.url ||
            (item.url !== '/dashboard' && pathname.startsWith(`${item.url}/`))

          return (
            <SidebarMenuItem key={item.title}>
              {item.locked ? (
                <SidebarMenuButton
                  disabled
                  tooltip={`${item.title} (Bloqueado)`}
                  className="h-9 rounded-lg text-[13.5px] font-medium text-muted-foreground/60 cursor-not-allowed opacity-70"
                >
                  <div className="flex items-center justify-between w-full px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 shrink-0">{item.icon}</span>
                      <span>{item.title}</span>
                    </div>
                    <LockIcon className="w-3.5 h-3.5" />
                  </div>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={`h-9 rounded-lg text-[13.5px] font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                      : 'text-zinc-600 hover:bg-muted/60 hover:text-zinc-900'
                  }`}
                >
                  <a href={item.url} className="flex items-center gap-2.5 px-3">
                    <span className={`w-4 h-4 shrink-0 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                      {item.icon}
                    </span>
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
