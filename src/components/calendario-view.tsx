'use client'

import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2Icon,
  ClockIcon,
  MapIcon,
  VideoIcon,
  CalendarIcon,
  CalendarDaysIcon,
} from 'lucide-react'

export function CalendarioView({ sponsor }: { sponsor: any }) {
  const activeParticipationIndex = sponsor.eventParticipations?.findIndex((p: any) => p.isCurrent)
  const activeParticipation = sponsor.eventParticipations?.[activeParticipationIndex]

  if (!activeParticipation || !activeParticipation.event) {
    return (
      <div className="text-center p-10 text-muted-foreground">
        No tienes un evento activo asignado.
      </div>
    )
  }

  const eventDoc = activeParticipation.event
  const moments = eventDoc.journey?.moments || []
  const meetings = activeParticipation.meetings || []

  if (moments.length === 0) {
    return (
      <div className="text-center p-10 bg-muted/20 border rounded-xl">
        <p className="text-lg font-medium">El evento aún no tiene un calendario definido.</p>
      </div>
    )
  }

  const nowTime = new Date().getTime()

  // 1. MAPEAMOS LOS MOMENTOS Y CALCULAMOS SUS RANGOS DE FECHAS
  const mappedMoments = moments.map((m: any) => {
    const items = m.items || []
    let minDate = Infinity
    let maxDate = -Infinity

    items.forEach((it: any) => {
      const d1 = new Date(it.date1).getTime()
      if (d1 < minDate) minDate = d1
      if (d1 > maxDate) maxDate = d1
      if (it.date2) {
        const d2 = new Date(it.date2).getTime()
        if (d2 > maxDate) maxDate = d2
      }
    })

    return {
      ...m,
      minDate: minDate === Infinity ? 0 : minDate,
      maxDate: maxDate === -Infinity ? 0 : maxDate,
      mixedItems: items.map((it: any) => ({
        ...it,
        type: 'journey_item',
        sortDate: new Date(it.date1).getTime(),
      })),
    }
  })

  // 2. INSERTAMOS LAS REUNIONES EN EL MOMENTO CORRECTO
  meetings.forEach((mtg: any) => {
    let assignedMoment = null

    if (mtg.scheduledDate) {
      const sd = new Date(mtg.scheduledDate).getTime()
      assignedMoment = mappedMoments.find((m: any) => sd >= m.minDate && sd <= m.maxDate)

      if (!assignedMoment) {
        let minDiff = Infinity
        mappedMoments.forEach((m: any) => {
          const diff = Math.min(Math.abs(sd - m.minDate), Math.abs(sd - m.maxDate))
          if (diff < minDiff) {
            minDiff = diff
            assignedMoment = m
          }
        })
      }
    } else if (mtg.projectedMonth) {
      const pMonth = mtg.projectedMonth.toLowerCase()
      assignedMoment = mappedMoments.find((m: any) => {
        if (m.minDate === 0) return false
        const mDateStr = new Date(m.minDate)
          .toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' })
          .toLowerCase()
        return pMonth.includes(mDateStr) || mDateStr.includes(pMonth)
      })
      if (!assignedMoment) assignedMoment = mappedMoments[0]
    } else {
      assignedMoment = mappedMoments[0]
    }

    if (assignedMoment) {
      assignedMoment.mixedItems.push({
        ...mtg,
        type: 'meeting',
        sortDate: mtg.scheduledDate ? new Date(mtg.scheduledDate).getTime() : -1,
      })
    }
  })

  // 3. ORDENAMOS LOS ÍTEMS INTERNOS CRONOLÓGICAMENTE
  mappedMoments.forEach((m: any) => {
    m.mixedItems.sort((a: any, b: any) => a.sortDate - b.sortDate)
  })

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario del Evento</h1>
        <p className="text-muted-foreground mt-2">
          Visualice la hoja de ruta general del evento y ubique sus reuniones dentro del journey.
        </p>
      </div>

      {/* NUEVO DISEÑO: LÍNEA DE TIEMPO VERTICAL IZQUIERDA */}
      <div className="ml-2 md:ml-4 border-l-2 border-muted-foreground/20 space-y-12 mt-10">
        {mappedMoments.map((moment: any, index: number) => {
          const isMomentCompleted =
            moment.mixedItems.length > 0 &&
            moment.mixedItems.every((item: any) => {
              if (item.type === 'journey_item') {
                const targetDate = item.date2
                  ? new Date(item.date2).getTime()
                  : new Date(item.date1).getTime()
                return targetDate < nowTime
              }
              return item.status === 'completed'
            })

          return (
            <div key={index} className="relative pl-8 md:pl-10">
              {/* NODO DE LA LÍNEA DE TIEMPO (Punto) */}
              <div
                className={`absolute -left-[17px] top-1 flex items-center justify-center w-8 h-8 rounded-full border-4 border-background
                ${isMomentCompleted ? 'bg-zinc-900 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}
              `}
              >
                {isMomentCompleted ? (
                  <CheckCircle2Icon className="w-4 h-4" />
                ) : (
                  <MapIcon className="w-4 h-4" />
                )}
              </div>

              {/* ENCABEZADO DEL MOMENTO */}
              <div className="mb-6 flex items-center gap-3">
                <h3 className="text-2xl font-bold">{moment.momentTitle}</h3>
                {isMomentCompleted && (
                  <Badge className="bg-zinc-900 text-white h-6">Completado</Badge>
                )}
              </div>

              {/* LISTA LIMPIA DE ÍTEMS Y REUNIONES */}
              <div className="space-y-4">
                {moment.mixedItems.map((item: any, iIndex: number) => {
                  // RENDERIZADO ÍTEM DE EVENTO
                  if (item.type === 'journey_item') {
                    const date1 = new Date(item.date1)
                    const isItemPast = item.date2
                      ? new Date(item.date2).getTime() < nowTime
                      : date1.getTime() < nowTime

                    return (
                      <div
                        key={iIndex}
                        className={`p-4 rounded-lg border transition-colors ${isItemPast ? 'bg-muted/30 opacity-70' : 'bg-card shadow-sm'}`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-0.5 p-2 rounded-md ${isItemPast ? 'bg-muted' : 'bg-primary/10'}`}
                          >
                            <CalendarDaysIcon
                              className={`w-4 h-4 ${isItemPast ? 'text-muted-foreground' : 'text-primary'}`}
                            />
                          </div>
                          <div>
                            <h4
                              className={`font-semibold text-base ${isItemPast ? 'line-through decoration-muted-foreground/30' : ''}`}
                            >
                              {item.itemTitle}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {date1.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                              {item.date2 &&
                                ` - ${new Date(item.date2).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // RENDERIZADO ÍTEM DE REUNIÓN (Diferenciado visualmente)
                  if (item.type === 'meeting') {
                    const isCompleted = item.status === 'completed'
                    const isScheduled = item.status === 'scheduled' && item.scheduledDate

                    return (
                      <div
                        key={iIndex}
                        className={`p-4 rounded-lg border-l-4 border-y border-r transition-colors 
                        ${isCompleted ? 'bg-muted/30 border-l-zinc-900 opacity-70' : 'bg-card border-l-primary shadow-sm'}
                      `}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-0.5 p-2 rounded-md ${isCompleted ? 'bg-muted' : 'bg-primary/10'}`}
                          >
                            <VideoIcon
                              className={`w-4 h-4 ${isCompleted ? 'text-zinc-900' : 'text-primary'}`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary"
                              >
                                REUNIÓN B2B
                              </Badge>
                            </div>
                            <h4
                              className={`font-semibold text-base ${isCompleted ? 'line-through decoration-muted-foreground/30' : ''}`}
                            >
                              {item.name}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {isScheduled
                                ? new Date(item.scheduledDate).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'long',
                                    timeZone: 'UTC',
                                  })
                                : `Mes proyectado: ${item.projectedMonth || 'Por definir'}`}
                            </p>
                          </div>
                          {isCompleted && (
                            <CheckCircle2Icon className="w-5 h-5 text-zinc-900 hidden sm:block" />
                          )}
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
