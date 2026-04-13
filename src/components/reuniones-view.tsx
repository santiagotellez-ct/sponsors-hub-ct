'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  VideoIcon,
  Loader2Icon,
  ExternalLinkIcon,
} from 'lucide-react'

export function ReunionesView({ sponsor }: { sponsor: any }) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const [selectedDate, setSelectedDate] = useState<string>('')

  const activeParticipationIndex = sponsor.eventParticipations?.findIndex((p: any) => p.isCurrent)
  const activeParticipation = sponsor.eventParticipations?.[activeParticipationIndex]

  if (!activeParticipation || !activeParticipation.event) {
    return (
      <div className="text-center p-10 text-muted-foreground">
        No tienes un evento activo asignado.
      </div>
    )
  }

  const meetings = activeParticipation.meetings || []

  const handleConfirmDate = async (meetingId: string) => {
    if (!selectedDate) {
      alert('Por favor, selecciona la fecha en la que agendaste tu reunión.')
      return
    }

    setIsUpdating(true)
    try {
      const updatedParticipations = [...sponsor.eventParticipations]
      const currentPart = updatedParticipations[activeParticipationIndex]

      currentPart.event =
        typeof currentPart.event === 'object' ? currentPart.event.id : currentPart.event
      currentPart.plan =
        typeof currentPart.plan === 'object' ? currentPart.plan.id : currentPart.plan

      currentPart.meetings = currentPart.meetings.map((m: any) => {
        if (m.id === meetingId) {
          return {
            ...m,
            status: 'scheduled',
            scheduledDate: selectedDate,
          }
        }
        return m
      })

      await fetch(`/api/sponsors/${sponsor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventParticipations: updatedParticipations }),
      })

      setSelectedDate('')
      router.refresh()
    } catch (error) {
      console.error('Error actualizando la reunión en Payload', error)
      alert('Hubo un error al guardar la fecha. Inténtalo de nuevo.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center p-10 bg-muted/20 border rounded-xl">
        <p className="text-lg font-medium">No hay reuniones programadas</p>
        <p className="text-sm text-muted-foreground">
          Este evento no tiene un esquema de reuniones por el momento.
        </p>
      </div>
    )
  }

  const nowTime = new Date().getTime()
  let currentActiveIndex = 0

  for (let i = 0; i < meetings.length; i++) {
    const m = meetings[i]
    if (m.status === 'completed') {
      currentActiveIndex = i + 1
    } else if (
      m.status === 'scheduled' &&
      m.scheduledDate &&
      new Date(m.scheduledDate).getTime() < nowTime
    ) {
      currentActiveIndex = i + 1
    } else {
      currentActiveIndex = i
      break
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roadmap de Sesiones</h1>
          <p className="text-muted-foreground mt-2">
            Agende y lleve el control de sus reuniones estratégicas con Colombia Tech.
          </p>
        </div>
      </div>

      <div className="relative space-y-6 mt-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {meetings.map((meeting: any, index: number) => {
          const isCompleted = meeting.status === 'completed'
          const isScheduled = meeting.status === 'scheduled'
          const isPastDue =
            isScheduled &&
            meeting.scheduledDate &&
            new Date(meeting.scheduledDate).getTime() < nowTime
          const isActive = index === currentActiveIndex
          const isLocked = index > currentActiveIndex

          // Detectamos si el texto en el campo platform es un link
          const hasPlatform = !!meeting.platform
          const isPlatformLink =
            hasPlatform &&
            (meeting.platform.startsWith('http://') || meeting.platform.startsWith('https://'))

          return (
            <div
              key={meeting.id || index}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10
                ${isCompleted ? 'bg-zinc-900 text-white' : isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
              `}
              >
                {isCompleted ? (
                  <CheckCircle2Icon className="w-5 h-5" />
                ) : isActive ? (
                  <VideoIcon className="w-5 h-5" />
                ) : (
                  <ClockIcon className="w-5 h-5" />
                )}
              </div>

              <Card
                className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] shadow-sm transition-opacity ${isLocked ? 'opacity-50 grayscale-[50%]' : ''}`}
              >
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-xl">{meeting.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <CalendarDaysIcon className="w-4 h-4" />
                        {meeting.projectedMonth
                          ? `Mes proyectado: ${meeting.projectedMonth}`
                          : 'Fecha por definir'}
                      </p>
                    </div>

                    {isCompleted && (
                      <Badge className="bg-zinc-900 text-white hover:bg-zinc-800">Completada</Badge>
                    )}
                    {isPastDue && !isCompleted && (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-200 bg-amber-50"
                      >
                        Agendada (Pasada)
                      </Badge>
                    )}
                    {isScheduled && !isPastDue && (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">
                        Agendada
                      </Badge>
                    )}
                    {isActive && !isScheduled && (
                      <Badge className="bg-blue-100 text-blue-700 border-0">Requiere Acción</Badge>
                    )}
                    {isLocked && (
                      <Badge variant="secondary" className="bg-muted-foreground/20">
                        Bloqueada
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* REUNIÓN AGENDADA CONFIRMADA */}
                  {isScheduled && meeting.scheduledDate && (
                    <div className="mb-6 p-5 rounded-lg bg-muted/20 border text-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4 text-primary" />
                        <span className="font-semibold">Fecha confirmada:</span>
                        {new Date(meeting.scheduledDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </div>

                      {/* LÓGICA DE PLATAFORMA / LINK */}
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <span className="font-semibold">Lugar / Enlace de Ingreso:</span>
                          {hasPlatform ? (
                            isPlatformLink ? (
                              <div className="mt-2">
                                <a
                                  href={meeting.platform}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md font-medium hover:bg-zinc-800 transition-colors"
                                >
                                  <VideoIcon className="w-4 h-4" />
                                  Entrar a la videollamada
                                  <ExternalLinkIcon className="w-3 h-3 ml-1 opacity-70" />
                                </a>
                              </div>
                            ) : (
                              <p className="mt-1">{meeting.platform}</p>
                            )
                          ) : (
                            <p className="mt-1 italic text-muted-foreground">
                              El link de ingreso será asignado por el administrador próximamente.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VISTA ACTIVA: EMBED CALENDLY + CONFIRMACIÓN MANUAL */}
                  {isActive && !isScheduled && !isCompleted && meeting.calendlyLink ? (
                    <div className="space-y-6">
                      <div className="border rounded-xl overflow-hidden shadow-inner bg-background">
                        <iframe
                          src={meeting.calendlyLink}
                          width="100%"
                          height="550"
                          frameBorder="0"
                          title={`Agendar ${meeting.name}`}
                          className="w-full"
                        />
                      </div>

                      <div className="p-5 border rounded-xl bg-muted/20 shadow-sm">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle2Icon className="w-4 h-4 text-primary" />
                          ¿Ya agendaste tu sesión?
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Por favor, confírmanos la fecha que seleccionaste en el calendario de
                          arriba para registrarla en el sistema.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <Label htmlFor={`date-${meeting.id}`} className="sr-only">
                              Fecha seleccionada
                            </Label>
                            <Input
                              id={`date-${meeting.id}`}
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              disabled={isUpdating}
                            />
                          </div>
                          <Button
                            onClick={() => handleConfirmDate(meeting.id)}
                            disabled={isUpdating || !selectedDate}
                            className="bg-zinc-900 text-white"
                          >
                            {isUpdating ? (
                              <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Confirmar Fecha
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* FALLBACKS */}
                  {isActive && !meeting.calendlyLink && !isScheduled && (
                    <p className="text-sm text-muted-foreground">
                      El enlace de agenda (Calendly) aún no ha sido configurado por el
                      administrador.
                    </p>
                  )}
                  {isLocked && (
                    <p className="text-sm text-muted-foreground italic">
                      Esta sesión se habilitará una vez se concluya la fase anterior.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
