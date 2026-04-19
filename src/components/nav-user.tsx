'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontalIcon,
  LogOutIcon,
  Loader2Icon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from 'lucide-react'

export function NavUser({
  user,
  sponsor,
}: {
  user: { name: string; email: string; avatar: string }
  sponsor?: any
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  // Estados para el Modal, Pestañas y Formulario
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'seguridad'>('general')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPwdLoading, setIsPwdLoading] = useState(false)
  const [pwdMessage, setPwdMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )

  // LOGOUT
  const handleLogout = async () => {
    try {
      await fetch('/api/sponsors/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  // Listener para abrir el modal desde el sidebar
  useEffect(() => {
    const handleOpenSettings = () => {
      setActiveTab('general')
      setIsAccountOpen(true)
    }
    window.addEventListener('open-settings', handleOpenSettings)
    return () => window.removeEventListener('open-settings', handleOpenSettings)
  }, [])

  // CAMBIO DE CONTRASEÑA
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMessage(null)

    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'Las contraseñas no coinciden.' })
      return
    }
    if (newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' })
      return
    }

    setIsPwdLoading(true)
    try {
      const res = await fetch(`/api/sponsors/${sponsor?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!res.ok) throw new Error('Error de servidor')

      setPwdMessage({ type: 'success', text: '¡Contraseña actualizada exitosamente!' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setPwdMessage({ type: 'error', text: 'Hubo un error al cambiar la contraseña.' })
    } finally {
      setIsPwdLoading(false)
    }
  }

  // Extraemos la info formateada
  const fullName = sponsor?.contactInfo?.fullName || 'Usuario'
  const events =
    sponsor?.eventsSummary !== 'Ninguno' ? sponsor?.eventsSummary : 'Ningún evento activo'
  const plan =
    sponsor?.currentPlanName !== 'Ninguno actual' ? sponsor?.currentPlanName : 'Sin plan asignado'

  return (
    <>
      <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex items-center justify-center h-8 w-8 shrink-0 rounded-lg bg-white border border-border/60 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-6 w-6 object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-zinc-700">{user.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <MoreHorizontalIcon className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg bg-background">
                  <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                  <AvatarFallback className="rounded-lg">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault()
                  setActiveTab('general') // Al abrir, siempre mostramos General por defecto
                  setIsAccountOpen(true)
                }}
              >
                <SettingsIcon className="mr-2 w-4 h-4" />
                Configuración de Cuenta
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onSelect={handleLogout}
            >
              <LogOutIcon className="mr-2 w-4 h-4" />
              Cerrar Sesión
            </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* --- MODAL DE CUENTA (Estilo ChatGPT Settings) --- */}
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden flex flex-col md:flex-row h-[500px] gap-0">
          <DialogTitle className="sr-only">Configuración de la cuenta</DialogTitle>

          {/* SIDEBAR IZQUIERDO DEL MODAL */}
          <div className="w-full md:w-[220px] bg-muted/30 md:border-r p-4 flex flex-col gap-1 overflow-y-auto">
            <div className="px-2 pb-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Configuración</h2>
            </div>

            <button
              onClick={() => setActiveTab('general')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                activeTab === 'general'
                  ? 'bg-muted font-medium text-foreground'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground',
              )}
            >
              <UserIcon className="w-4 h-4" /> General
            </button>

            <button
              onClick={() => setActiveTab('seguridad')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                activeTab === 'seguridad'
                  ? 'bg-muted font-medium text-foreground'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground',
              )}
            >
              <ShieldIcon className="w-4 h-4" /> Seguridad
            </button>
          </div>

          {/* CONTENIDO DERECHO DEL MODAL */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-background">
            {/* PESTAÑA: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <h3 className="text-lg font-medium border-b pb-4">General</h3>

                <div className="space-y-0 text-sm">
                  <div className="flex justify-between items-center py-4 border-b">
                    <span className="text-muted-foreground">Razón Social</span>
                    <span className="font-medium text-right">{user.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b">
                    <span className="text-muted-foreground">Representante</span>
                    <span className="font-medium text-right">{fullName}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b">
                    <span className="text-muted-foreground">Correo Corporativo</span>
                    <span className="font-medium text-right">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b">
                    <span className="text-muted-foreground">Eventos Asignados</span>
                    <span className="font-medium text-right">{events}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b">
                    <span className="text-muted-foreground">Plan Actual</span>
                    <span className="font-medium text-right">{plan}</span>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: SEGURIDAD */}
            {activeTab === 'seguridad' && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <h3 className="text-lg font-medium border-b pb-4">Seguridad</h3>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 text-sm text-primary">
                  <ShieldIcon className="w-5 h-5 shrink-0" />
                  <p>
                    Mantén tu cuenta protegida usando una contraseña de al menos 6 caracteres que no
                    uses en otros servicios.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">Nueva Contraseña</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {pwdMessage && (
                    <div
                      className={`text-sm p-3 rounded-md border ${pwdMessage.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-green-50 text-green-700 border-green-200'}`}
                    >
                      {pwdMessage.text}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isPwdLoading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                  >
                    {isPwdLoading ? <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> : null}
                    Actualizar Contraseña
                  </Button>
                </form>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
