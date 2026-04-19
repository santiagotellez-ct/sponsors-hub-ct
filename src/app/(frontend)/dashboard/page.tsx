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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Iconos
import {
  CalendarDaysIcon,
  StarIcon,
  TargetIcon,
  PlayIcon,
  ArrowUpRightIcon,
  HourglassIcon,
  PackageIcon,
  VideoIcon,
  ClockIcon,
  UsersIcon,
  ArrowRightIcon,
  CheckIcon,
  ImageIcon,
  LinkIcon,
  FileTextIcon,
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

  // 1. VALIDACIÓN ONBOARDING
  const hasLogo = !!sponsor.logo
  const hasContactInfo =
    sponsor.contactInfo?.fullName && sponsor.contactInfo?.whatsapp && sponsor.contactInfo?.linkedin
  const activeParticipation = sponsor.eventParticipations?.find((p: any) => p.isCurrent)
  const hasStrategy =
    activeParticipation?.strategy?.description &&
    activeParticipation?.strategy?.eventObjectives &&
    activeParticipation?.strategy?.brandDifferentiator

  const needsOnboarding = !hasLogo || !hasContactInfo || !hasStrategy

  // 2. EJECUCIÓN DEL PATROCINIO
  const benefitItems = activeParticipation?.benefitItems || []
  const totalItems = benefitItems.length
  const completedItems = benefitItems.filter((item: any) => item.status === 'completed').length
  const executionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  // 3. EVENTO Y TIEMPO
  let countdownText = 'Fecha no definida'
  let daysLeft = 0
  const eventDoc = activeParticipation?.event
  if (eventDoc && typeof eventDoc === 'object' && eventDoc.startDate) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const eventDate = new Date(eventDoc.startDate)
    eventDate.setHours(0, 0, 0, 0)
    const diffTime = eventDate.getTime() - now.getTime()
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (daysLeft > 0) countdownText = `Faltan ${daysLeft} días`
    else if (daysLeft === 0) countdownText = '¡El evento es hoy!'
    else countdownText = 'Evento finalizado'
  }

  // 4. REUNIONES
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

  // 5. HOJA DE RUTA: AHORA BASADA EN LAS CATEGORÍAS DE BENEFICIOS DEL PLAN
  let moments = []

  const allBenefitItems = activeParticipation?.benefitItems || []
  const allDeliverables = activeParticipation?.deliverables || []

  const categoriesMap = new Map()

  const processCategoryItem = (item: any) => {
    const cat = item.benefitCategory || 'Patrocinio general'
    if (!categoriesMap.has(cat)) {
      categoriesMap.set(cat, { title: cat, total: 0, completed: 0 })
    }
    const entry = categoriesMap.get(cat)
    entry.total++
    if (item.status === 'completed') entry.completed++
  }

  allBenefitItems.forEach(processCategoryItem)
  allDeliverables.forEach(processCategoryItem)

  if (categoriesMap.size > 0) {
    const categoriesArray = Array.from(categoriesMap.values())

    moments = categoriesArray.map((c, index) => {
      const isCompleted = c.completed === c.total && c.total > 0
      const isActive = c.completed > 0 && c.completed < c.total

      return {
        id: index + 1,
        title: c.title,
        subtitle: 'Beneficios',
        status: isCompleted ? 'completed' : (isActive ? 'active' : 'pending'),
      }
    })

    const activeIndex = moments.findIndex((m) => m.status === 'active')
    if (activeIndex === -1) {
      const firstPending = moments.findIndex((m) => m.status === 'pending')
      if (firstPending !== -1) {
        moments[firstPending].status = 'active'
      }
    }
    
    // Todo lo que esté antes del activo lo podemos marcar completado, y todo lo que esté después locked (opcional)
    let finalActiveSeen = false
    moments.forEach((m) => {
      if (m.status === 'active') {
         finalActiveSeen = true
      } else if (!finalActiveSeen) {
         m.status = 'completed'
      } else {
         m.status = 'locked'
      }
    })

  } else {
    // FALLBACK
    moments = [
      { id: 1, title: 'Sin beneficios asignados', subtitle: 'Pendiente', status: 'pending' },
    ]
  }

  const currentPhase = moments.find((m) => m.status === 'active')?.title || moments[moments.length - 1]?.title || 'En curso'


  // 6. ENTREGABLES RECIENTES (Máx 4 para la tabla inferior)
  const deliverables = activeParticipation?.deliverables || []
  const recentDeliverables = deliverables.slice(0, 4)

  // FECHA ACTUAL PARA EL SALUDO
  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)

  return (
    <TooltipProvider>
      <div className="[--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <SiteHeader sponsor={sponsor} />
          <div className="flex flex-1">
            <AppSidebar sponsor={sponsor} />
            <SidebarInset>
              <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 max-w-7xl mx-auto w-full pb-20">
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
                  <div className="w-full flex flex-col gap-8">
                    {/* GREETING NUEVO DISEÑO */}
                    <div>
                      <div className="flex items-center flex-wrap gap-2.5 text-[14px] text-muted-foreground mb-3 tracking-tight">
                        <span className="capitalize">{capitalizedDate}</span>
                        <span>·</span>
                        <div className="flex items-center border border-border bg-card rounded-full pl-2 pr-2.5 py-0.5 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          <span className="uppercase tracking-widest text-[10px] text-muted-foreground font-semibold">
                            PRÓXIMO EVENTO
                          </span>
                        </div>
                        <span className="text-[14px] font-semibold text-foreground tracking-tight ml-0.5">
                          {(eventDoc as any)?.title || 'Sin Evento'}
                        </span>
                      </div>
                      <h1 className="text-[32px] tracking-tight m-0 leading-tight">
                        <span className="font-bold">Hola {sponsor.contactInfo?.fullName?.split(' ')[0] || 'Sponsor'},</span>{' '}
                        <span className="text-muted-foreground font-bold">{sponsor.companyName}</span>
                      </h1>
                      <p className="text-muted-foreground mt-3 text-[15px] max-w-2xl leading-relaxed">
                        Tu patrocinio en{' '}
                        <strong className="text-foreground font-semibold">
                          {(eventDoc as any)?.title || 'el evento'}
                        </strong>{' '}
                        avanza según el plan. Aquí está el resumen.
                      </p>
                    </div>

                    {/* KPI ROW (4 Tarjetas Clickeables) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* TARJETA 1: Evento */}
                      <Link href="/dashboard/planes" className="group block h-full">
                        <div className="rounded-xl bg-card p-5 border shadow-sm flex flex-col justify-between h-full min-h-[168px] transition-all hover:border-primary/30 hover:shadow-md">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                              <CalendarDaysIcon className="w-3.5 h-3.5 opacity-60" />
                              Evento asignado
                            </div>
                            <div className="text-xl font-semibold tracking-tight text-foreground leading-tight line-clamp-2">
                              {(eventDoc as any)?.title || 'Sin Evento'}
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                              <HourglassIcon className="w-3.5 h-3.5 text-primary" />
                              {countdownText}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground mt-1">
                              {(eventDoc as any)?.startDate
                                ? new Date((eventDoc as any).startDate).toLocaleDateString(
                                    'es-ES',
                                    { month: 'short', year: 'numeric' },
                                  )
                                : 'Fechas por definir'}
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* TARJETA 2: Plan */}
                      <Link href="/dashboard/planes" className="group block h-full">
                        <div className="rounded-xl bg-card p-5 border shadow-sm flex flex-col justify-between h-full min-h-[168px] transition-all hover:border-primary/30 hover:shadow-md">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                              <StarIcon className="w-3.5 h-3.5 opacity-60" />
                              Plan activo
                            </div>
                            <div className="text-xl font-semibold tracking-tight text-foreground uppercase">
                              {sponsor.currentPlanName !== 'Ninguno actual'
                                ? sponsor.currentPlanName
                                : 'Sin Plan'}
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                              <PackageIcon className="w-3.5 h-3.5 text-primary" />
                              {totalItems} beneficios activos
                            </div>
                            <div className="text-[11.5px] text-muted-foreground mt-1">
                              Gestión por administrador
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* TARJETA 3: Ejecución */}
                      <Link href="/dashboard/entregables" className="group block h-full">
                        <div className="rounded-xl bg-card p-5 border shadow-sm flex flex-col justify-between h-full min-h-[168px] transition-all hover:border-[#A9E63F]/40 hover:shadow-md">
                          <div>
                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                              <span className="flex items-center gap-1.5">
                                <TargetIcon className="w-3.5 h-3.5 opacity-60" />
                                Ejecución
                              </span>
                              <span className="text-[11px] font-mono">
                                {completedItems}/{totalItems}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1 group-hover:text-[#A9E63F] transition-colors">
                              <div className="text-3xl font-semibold tracking-tight text-foreground group-hover:text-[#88ba30] dark:group-hover:text-[#A9E63F]">
                                {executionPercentage}
                              </div>
                              <div className="text-base font-medium text-muted-foreground">%</div>
                            </div>

                            {/* Barra de progreso de 24 bloques */}
                            <div className="flex gap-[2px] h-[5px] w-full mt-2.5">
                              {Array.from({ length: 24 }).map((_, i) => {
                                const isActive = i < Math.round((executionPercentage / 100) * 24)
                                return (
                                  <div
                                    key={i}
                                    className={`flex-1 rounded-[1.5px] transition-colors ${
                                      isActive ? 'bg-[#A9E63F]' : 'bg-muted-foreground/20'
                                    }`}
                                  />
                                )
                              })}
                            </div>
                          </div>
                          <div className="text-[11.5px] text-muted-foreground mt-3">
                            {totalItems - completedItems} beneficios restantes
                          </div>
                        </div>
                      </Link>

                      {/* TARJETA 4: Próxima Reunión */}
                      <Link href="/dashboard/reuniones" className="group block h-full">
                        <div className="rounded-xl bg-card p-5 border shadow-sm flex flex-col justify-between h-full min-h-[168px] relative transition-all hover:border-indigo-500/40 hover:shadow-md overflow-hidden">
                          <div>
                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                              <span className="flex items-center gap-1.5">
                                <VideoIcon className="w-3.5 h-3.5 opacity-60" />
                                Próxima reunión
                              </span>
                              <ArrowUpRightIcon className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
                            </div>
                            <div className="text-[16px] font-semibold tracking-tight text-foreground leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {nextMeeting ? nextMeeting.name : 'Al día'}
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                              <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
                              {nextMeeting?.scheduledDate
                                ? new Date(nextMeeting.scheduledDate).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    timeZone: 'UTC',
                                  })
                                : nextMeeting?.projectedMonth || 'Sin pendientes'}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground mt-1">
                              Con Equipo Sponsor Hub
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* SECCIÓN 2 COLUMNAS (Hoja de ruta + Detalle Reunión) */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
                      {/* COLUMNA IZQ: Hoja de Ruta */}
                      <div className="rounded-xl bg-card border shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <div className="text-[15px] font-semibold text-foreground tracking-tight">
                              Ejecución de beneficios
                            </div>
                            <div className="text-[13px] text-muted-foreground mt-1">
                              {moments.length} agrupaciones · Ejecutando <span className="font-medium text-foreground">{currentPhase}</span>
                            </div>
                          </div>
                          <Link href="/dashboard/entregables" className="text-[13px] font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                            Ver entregables <ArrowRightIcon className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted">
                          <div className="relative flex justify-between w-full min-w-[500px] mt-4 pb-2 px-1">
                            {/* Línea conectora */}
                            <div 
                              className="absolute top-[11px] h-[1px] bg-border z-0" 
                              style={{ 
                                left: `calc(100% / ${moments.length * 2})`, 
                                right: `calc(100% / ${moments.length * 2})` 
                              }} 
                            />

                            {moments.map((m) => {
                            const isCompleted = m.status === 'completed'
                            const isActive = m.status === 'active'
                            const isLocked = m.status === 'locked'

                            return (
                              <div
                                key={m.id}
                                className="flex flex-col items-center text-center relative z-10 flex-1 px-1"
                              >
                                <div
                                  className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center mb-3 transition-colors ${
                                    isCompleted
                                      ? 'bg-zinc-900 dark:bg-zinc-100 border-2 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                                      : isActive
                                        ? 'bg-background border-[1.5px] border-zinc-900 dark:border-zinc-100 shadow-sm'
                                        : isLocked
                                          ? 'bg-muted/50 border-[1.5px] border-muted-foreground/20'
                                          : 'bg-card border-[1.5px] border-border'
                                  }`}
                                >
                                  {isCompleted && <CheckIcon className="w-3.5 h-3.5 text-background" />}
                                  {isActive && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                                  )}
                                </div>
                                <div
                                  className={`text-[12.5px] font-semibold tracking-tight leading-tight ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}
                                >
                                  {m.title}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 px-1">
                                  {m.subtitle}
                                </div>
                              </div>
                            )
                          })}
                          </div>
                        </div>
                      </div>

                      {/* COLUMNA DER: Detalle Próxima Reunión */}
                      <div className="rounded-xl bg-card border shadow-sm p-6 flex flex-col gap-4 h-full relative">
                        <div className="flex justify-between items-start">
                          <div className="text-[15px] font-semibold tracking-tight">
                            Próxima sesión
                          </div>
                          <Badge variant="outline" className="font-normal text-[11px] h-6 px-2 border-border shadow-sm bg-background">
                            <VideoIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" /> Videollamada
                          </Badge>
                        </div>

                        <div>
                          <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5 font-medium">
                            {nextMeeting?.scheduledDate ? 'Agendada' : 'Pendiente por definir'}
                          </div>
                          <div className="text-xl font-semibold tracking-tight leading-tight">
                            {nextMeeting ? nextMeeting.name : 'No hay reuniones próximas'}
                          </div>
                        </div>

                        {nextMeeting && (
                          <div className="flex flex-col mt-auto h-full justify-between">
                            <div className="flex flex-col gap-2.5 p-3.5 bg-muted/40 rounded-lg text-[13px] mt-2 border border-border/50">
                              <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="w-4 h-4 opacity-50" />
                                <span>
                                  {nextMeeting.scheduledDate
                                    ? new Date(nextMeeting.scheduledDate).toLocaleDateString(
                                        'es-ES',
                                        {
                                          weekday: 'long',
                                          day: 'numeric',
                                          month: 'long',
                                          timeZone: 'UTC',
                                        },
                                      )
                                    : nextMeeting.projectedMonth}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-1">
                              {nextMeeting.platform ? (
                                <a href={nextMeeting.platform} target="_blank" rel="noopener noreferrer" className="block">
                                  <Button className="w-full font-semibold shadow-sm h-10 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                                    <VideoIcon className="w-4 h-4 mr-2" /> Entrar a la reunión
                                  </Button>
                                </a>
                              ) : nextMeeting.calendlyLink ? (
                                <a href={nextMeeting.calendlyLink} target="_blank" rel="noopener noreferrer" className="block">
                                  <Button variant="outline" className="w-full font-semibold shadow-sm h-10">
                                    <CalendarDaysIcon className="w-4 h-4 mr-2" /> Agendar sesión
                                  </Button>
                                </a>
                              ) : (
                                <Button disabled variant="outline" className="w-full font-medium h-10 text-muted-foreground border-dashed">
                                  Sin enlace disponible
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECCIÓN INFERIOR: Entregables en curso */}
                    <div className="rounded-xl bg-card border shadow-sm p-6">
                      <div className="flex justify-between items-center mb-5">
                        <div>
                          <div className="text-[15px] font-semibold tracking-tight">
                            Entregables en curso
                          </div>
                          <div className="text-[12.5px] text-muted-foreground mt-0.5">
                            Material pendiente para mantener el ritmo
                          </div>
                        </div>
                        <Link
                          href="/dashboard/entregables"
                          className="text-[13px] font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Ver todos <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="grid gap-2">
                        {recentDeliverables.length > 0 ? (
                          recentDeliverables.map((deliv: any, idx: number) => {
                            const isImage = deliv.type === 'image'
                            const isLink = deliv.type === 'link'
                            const isDoc = deliv.type === 'document'

                            return (
                              <div
                                key={idx}
                                className="grid grid-cols-[24px_1fr_auto_auto_auto] items-center gap-3.5 p-3 bg-card border rounded-lg hover:bg-muted/30 transition-colors"
                              >
                                <div className="w-[22px] h-[22px] rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                  {isImage ? (
                                    <ImageIcon className="w-3 h-3" />
                                  ) : isLink ? (
                                    <LinkIcon className="w-3 h-3" />
                                  ) : (
                                    <FileTextIcon className="w-3 h-3" />
                                  )}
                                </div>
                                <div className="text-[13.5px] font-medium text-foreground truncate">
                                  {deliv.itemName}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize hidden md:block">
                                  {deliv.type}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono hidden sm:block">
                                  {deliv.dueDate
                                    ? `Vence ${new Date(deliv.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', timeZone: 'UTC' })}`
                                    : 'Sin fecha'}
                                </div>
                                <div>
                                  <Badge
                                    variant={
                                      deliv.status === 'completed'
                                        ? 'default'
                                        : deliv.status === 'pending'
                                          ? 'secondary'
                                          : 'destructive'
                                    }
                                    className="text-[10px] uppercase font-semibold tracking-wider"
                                  >
                                    {deliv.status === 'completed'
                                      ? 'Completado'
                                      : deliv.status === 'pending'
                                        ? 'Pendiente'
                                        : 'Vencido'}
                                  </Badge>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="p-6 text-center text-sm text-muted-foreground border rounded-lg border-dashed">
                            No tienes entregables pendientes por ahora.
                          </div>
                        )}
                      </div>
                    </div>
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
