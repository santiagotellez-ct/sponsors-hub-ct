import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { OnboardingForm } from '@/components/onboarding-form'

// Iconos para enriquecer las tarjetas
import {
  CalendarDaysIcon,
  StarIcon,
  TargetIcon,
  PlayIcon,
  CheckCircle2Icon,
  ArrowUpRightIcon,
  HourglassIcon,
  ListTodoIcon,
} from 'lucide-react'

export const iframeHeight = '800px'
export const description = 'Sponsor Hub Dashboard'

export default async function DashboardPage() {
  const payload = await getPayload({ config: configPromise })
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) redirect('/')

  const { user } = await payload.auth({
    headers: new Headers({
      Authorization: `JWT ${token}`,
    }),
  })

  if (!user || user.collection !== 'sponsors') redirect('/')

  const sponsor = await payload.findByID({
    collection: 'sponsors',
    id: user.id,
    depth: 2,
  })

  // 1. LÓGICA DE VALIDACIÓN DE ONBOARDING
  const hasLogo = !!sponsor.logo
  const hasContactInfo =
    sponsor.contactInfo?.fullName && sponsor.contactInfo?.whatsapp && sponsor.contactInfo?.linkedin
  const activeParticipation = sponsor.eventParticipations?.find((p: any) => p.isCurrent)
  const hasStrategy =
    activeParticipation?.strategy?.description &&
    activeParticipation?.strategy?.eventObjectives &&
    activeParticipation?.strategy?.brandDifferentiator

  const needsOnboarding = !hasLogo || !hasContactInfo || !hasStrategy

  // 2. LÓGICA: EJECUCIÓN DEL PATROCINIO
  const benefitItems = activeParticipation?.benefitItems || []
  const totalItems = benefitItems.length
  const completedItems = benefitItems.filter((item: any) => item.status === 'completed').length
  const executionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  // 3. LÓGICA: CONTADOR DE TIEMPO DEL EVENTO
  let countdownText = 'Fecha no definida'
  const eventDoc = activeParticipation?.event
  if (eventDoc && typeof eventDoc === 'object' && eventDoc.startDate) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const eventDate = new Date(eventDoc.startDate)
    eventDate.setHours(0, 0, 0, 0)

    const diffTime = eventDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 0) countdownText = `Faltan ${diffDays} días`
    else if (diffDays === 0) countdownText = '¡El evento es hoy!'
    else countdownText = 'Evento finalizado'
  }

  // 4. LÓGICA: PRÓXIMA REUNIÓN
  const meetings = activeParticipation?.meetings || []
  const nowTime = new Date().getTime()

  const activeMeetings = meetings.filter((m: any) => {
    if (m.status === 'completed') return false
    if (m.scheduledDate) return new Date(m.scheduledDate).getTime() >= nowTime
    return true
  })

  activeMeetings.sort((a: any, b: any) => {
    if (!a.scheduledDate) return 1
    if (!b.scheduledDate) return -1
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  })

  const nextMeeting = activeMeetings.length > 0 ? activeMeetings[0] : null

  return (
    <TooltipProvider>
      <div className="[--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar sponsor={sponsor} />
            <SidebarInset>
              <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 max-w-7xl mx-auto w-full">
                {needsOnboarding ? (
                  <div className="max-w-3xl mx-auto w-full mt-4 mb-20">
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold tracking-tight">
                        Bienvenido a Sponsors Hub
                      </h1>
                      <p className="text-muted-foreground mt-2">
                        Para habilitar su panel de control, por favor complete la información básica
                        de su empresa.
                      </p>
                    </div>
                    <div className="p-6 md:p-8 border rounded-xl bg-card text-card-foreground shadow-sm">
                      <OnboardingForm sponsor={sponsor} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <h1 className="text-2xl font-bold mb-6">
                      Hola {sponsor.contactInfo?.fullName?.split(' ')[0] || 'Sponsor'},{' '}
                      {sponsor.companyName} 👋
                    </h1>

                    {/* REDISEÑO: GRID DE 4 TARJETAS SUPERIORES */}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
                      {/* TARJETA 1: Evento */}
                      <div className="rounded-xl bg-card p-6 border shadow-sm flex flex-col justify-between h-full min-h-[180px]">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Evento Asignado
                            </p>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium text-foreground border">
                              <CalendarDaysIcon className="w-3 h-3" /> Foco
                            </span>
                          </div>
                          <h3
                            className="text-2xl font-bold truncate tracking-tight mb-2"
                            title={(eventDoc as any)?.title}
                          >
                            {(eventDoc as any)?.title ? (eventDoc as any).title : 'Sin Evento'}
                          </h3>
                        </div>
                        <div className="mt-auto pt-4">
                          <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                            <HourglassIcon className="w-4 h-4" /> {countdownText}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Para el evento activo
                          </p>
                        </div>
                      </div>

                      {/* TARJETA 2: Plan */}
                      <div className="rounded-xl bg-card p-6 border shadow-sm flex flex-col justify-between h-full min-h-[180px]">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-muted-foreground">Plan Activo</p>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium text-foreground border">
                              <StarIcon className="w-3 h-3" /> Nivel
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold truncate tracking-tight uppercase mb-2">
                            {sponsor.currentPlanName !== 'Ninguno actual'
                              ? sponsor.currentPlanName
                              : 'Sin Plan'}
                          </h3>
                        </div>
                        <div className="mt-auto pt-4">
                          <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                            <ListTodoIcon className="w-4 h-4" /> Beneficios asignados
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Gestión por administrador
                          </p>
                        </div>
                      </div>

                      {/* TARJETA 3: Ejecución (Barra Segmentada) */}
                      <div className="rounded-xl bg-card p-6 border shadow-sm flex flex-col justify-between h-full min-h-[180px]">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Ejecución del Patrocinio
                            </p>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50/50 border border-green-200 text-xs font-medium text-green-700">
                              <CheckCircle2Icon className="w-3 h-3" /> {completedItems}/{totalItems}
                            </span>
                          </div>
                          <h3 className="text-3xl font-light tracking-tighter mb-1">
                            {executionPercentage}%
                          </h3>

                          {/* BARRA SEGMENTADA */}
                          <div className="flex gap-[2px] h-5 w-full mt-2">
                            {Array.from({ length: 24 }).map((_, i) => {
                              const isActive = i < Math.round((executionPercentage / 100) * 24)
                              return (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-[1px] ${isActive ? 'bg-foreground' : 'bg-muted-foreground/20'}`}
                                />
                              )
                            })}
                          </div>
                        </div>
                        <div className="mt-auto pt-4">
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <TargetIcon className="w-3 h-3" /> En base a estatus global
                          </p>
                        </div>
                      </div>

                      {/* TARJETA 4: Próxima Reunión (Clickeable) */}
                      <Link href="/dashboard/reuniones" className="group block h-full">
                        <div className="rounded-xl bg-card p-6 border shadow-sm flex flex-col justify-between h-full min-h-[180px] transition-all group-hover:border-primary/40 group-hover:shadow-md relative overflow-hidden">
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRightIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Próxima Reunión
                              </p>
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium text-foreground border group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                                <PlayIcon className="w-3 h-3" /> Sig.
                              </span>
                            </div>
                            <h3 className="text-2xl font-bold truncate tracking-tight mb-2 group-hover:text-primary transition-colors">
                              {nextMeeting ? nextMeeting.name : 'Al día'}
                            </h3>
                          </div>
                          <div className="mt-auto pt-4">
                            <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                              {nextMeeting?.scheduledDate
                                ? new Date(nextMeeting.scheduledDate).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    timeZone: 'UTC',
                                  })
                                : nextMeeting?.projectedMonth || 'Sin reuniones pendientes'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Ciclo de seguimiento
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* BLOQUE INFERIOR: DETALLE PRÓXIMA REUNIÓN (Clickeable) */}
                    <Link href="/dashboard/reuniones" className="block group">
                      <div className="min-h-[25vh] rounded-xl bg-card border shadow-sm flex flex-col p-8 transition-all group-hover:border-primary/30 group-hover:shadow-md relative overflow-hidden">
                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 group-hover:-translate-y-1 duration-300">
                          <ArrowUpRightIcon className="w-6 h-6 text-primary" />
                        </div>

                        <h2 className="text-lg font-bold border-b pb-4 mb-6">
                          Detalle de Próxima Reunión
                        </h2>

                        {nextMeeting ? (
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-muted/20 group-hover:bg-muted/40 transition-colors rounded-lg border border-transparent group-hover:border-border">
                            <div>
                              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                                {nextMeeting.name}
                              </h3>
                              <p className="text-muted-foreground mt-1">
                                {nextMeeting.scheduledDate
                                  ? `Agendada para: ${new Date(nextMeeting.scheduledDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}`
                                  : `Mes proyectado: ${nextMeeting.projectedMonth || 'Por definir'}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-900 text-white shadow-sm">
                                {nextMeeting.scheduledDate ? 'Agendada' : 'Requiere Agendar'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                            <CheckCircle2Icon className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Todas completadas</p>
                            <p className="text-sm mt-1">
                              No hay reuniones próximas en el calendario.
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </TooltipProvider>
  )
}
