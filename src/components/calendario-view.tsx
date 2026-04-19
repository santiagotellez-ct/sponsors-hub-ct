'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  CheckCircle2Icon,
  VideoIcon,
  CalendarIcon,
  MapPinIcon,
  CircleDashedIcon,
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

  const eventDoc = typeof activeParticipation.event === 'object' ? activeParticipation.event : null

  if (!eventDoc) {
    return <div>Error al cargar info de evento.</div>
  }

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

  // FECHAS DEL EVENTO ASIGNADO
  const startDate = eventDoc.startDate ? new Date(eventDoc.startDate) : null
  const endDate = eventDoc.endDate ? new Date(eventDoc.endDate) : null

  let countdownText = 'En curso'
  let diffDays = 0
  if (startDate) {
    const timeDiff = startDate.getTime() - nowTime
    if (timeDiff > 0) {
      diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
      countdownText = `${diffDays}`
    } else if (endDate && endDate.getTime() < nowTime) {
      countdownText = 'Finalizado'
    }
  } else {
    countdownText = 'Por definir'
  }

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

  let foundFirstOngoing = false

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Calendario del evento</h1>
        <p className="text-muted-foreground mt-2 text-[15px]">
          Visualiza la hoja de ruta general y ubica tus reuniones dentro del journey.
        </p>
      </div>

      <Card className="shadow-sm border border-border/50 rounded-2xl px-7 py-6 flex flex-col md:flex-row justify-between md:items-center bg-white mt-8 mb-4 gap-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase mb-2">
            Evento Asignado
          </p>
          <h2 className="text-[22px] font-bold text-zinc-900 tracking-tight leading-snug mb-3">
            {eventDoc.title}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 text-[13px] text-muted-foreground font-normal">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <CalendarIcon className="w-[15px] h-[15px] opacity-60 shrink-0" />
              {startDate?.getDate() || '--'}{' '}
              {endDate && endDate.getTime() !== startDate?.getTime() && `— ${endDate.getDate()}`}{' '}
              {startDate ? startDate.toLocaleDateString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + startDate.toLocaleDateString('es-ES', { month: 'long' }).slice(1) : ''},{' '}
              {startDate?.getFullYear()}
            </span>
            {eventDoc.location && (
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="w-[15px] h-[15px] opacity-60 shrink-0" />
                {eventDoc.location.venue || 'Lugar por definir'},{' '}
                {eventDoc.location.city || 'Ciudad'}
              </span>
            )}
          </div>
        </div>
        <div className="md:text-right border-t md:border-t-0 pt-5 md:pt-0 shrink-0">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase mb-1">
            Cuenta Regresiva
          </p>
          {diffDays > 0 ? (
            <div className="flex items-baseline gap-1.5 md:justify-end">
              <span className="text-[52px] font-bold text-zinc-900 leading-none tracking-tight">
                {diffDays}
              </span>
              <span className="text-[14px] font-normal text-muted-foreground pb-1">días</span>
            </div>
          ) : (
            <p className="text-[22px] font-bold text-zinc-900 leading-none mt-1">{countdownText}</p>
          )}
        </div>
      </Card>

      {/* LÍNEA DE TIEMPO VERTICAL IZQUIERDA */}
      <div className="ml-2 md:ml-4 border-l-[1.5px] border-border/70 space-y-12 mt-10">
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

          let isMomentOngoing = false
          if (!isMomentCompleted && !foundFirstOngoing) {
            isMomentOngoing = true
            foundFirstOngoing = true
          }

          const monthText =
            moment.minDate !== 0
              ? new Date(moment.minDate).getMonth() === new Date(moment.maxDate).getMonth()
                ? new Date(moment.minDate)
                    .toLocaleDateString('es-ES', { month: 'long' })
                    .toUpperCase()
                : `${new Date(moment.minDate).toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()} — ${new Date(moment.maxDate).toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()}`
              : 'FECHAS'

          return (
            <div key={index} className="relative pl-8 md:pl-12">
              {/* NODO LÍNEA DE TIEMPO */}
              <div
                className={`absolute -left-[18.5px] top-4 flex items-center justify-center w-9 h-9 rounded-full outline outline-[6px] outline-background shrink-0
                ${isMomentCompleted ? 'bg-primary border border-primary text-primary-foreground' : isMomentOngoing ? 'bg-transparent border border-muted-foreground/30 text-muted-foreground' : 'bg-transparent border border-border/70 text-muted-foreground/40'}
              `}
              >
                {isMomentCompleted ? (
                  <CheckCircle2Icon className="w-4 h-4" />
                ) : isMomentOngoing ? (
                  <CircleDashedIcon className="w-4 h-4 opacity-70" />
                ) : (
                  <div className="w-[6px] h-[6px] rounded-full bg-border" />
                )}
              </div>

              {/* ENCABEZADO DEL MOMENTO */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 pt-[0.5px]">
                <div className="space-y-0.5">
                  <p className="text-[10.5px] font-bold tracking-widest text-muted-foreground uppercase opacity-80">
                    FASE {index + 1 < 10 ? `0${index + 1}` : index + 1} · {monthText}
                  </p>
                  <h3 className="text-[22px] font-bold text-zinc-900 tracking-tight leading-none pt-1">
                    {moment.momentTitle}
                  </h3>
                </div>
                <div className="mt-1 sm:mt-4 sm:ml-2">
                  {isMomentCompleted && (
                    <span className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
                      Completada
                    </span>
                  )}
                  {!isMomentCompleted && isMomentOngoing && (
                    <span className="inline-flex items-center rounded-md bg-white border border-border/80 px-3 py-1 text-[11px] font-medium text-zinc-600 shadow-sm">
                      En curso
                    </span>
                  )}
                </div>
              </div>

              {/* LISTA DE ÍTEMS Y REUNIONES */}
              <div className="space-y-3">
                {moment.mixedItems.map((item: any, iIndex: number) => {
                  if (item.type === 'journey_item') {
                    const date1 = new Date(item.date1)
                    const isItemPast = item.date2
                      ? new Date(item.date2).getTime() < nowTime
                      : date1.getTime() < nowTime

                    return (
                      <div
                        key={iIndex}
                        className="py-3 px-4 bg-white border border-border/60 shadow-xs rounded-[12px] flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted/20 border border-border/30 flex flex-col items-center justify-center shrink-0">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground/60" />
                          </div>
                          <div className="flex flex-col">
                            <h4
                              className={`font-semibold text-[13.5px] text-zinc-900 ${isItemPast ? 'text-muted-foreground line-through decoration-muted-foreground/30 opacity-70' : ''}`}
                            >
                              {item.itemTitle}
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[12px] text-muted-foreground font-medium hidden xs:block">
                            {date1.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            {item.date2 &&
                              ` - ${new Date(item.date2).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`}
                          </span>
                        </div>
                      </div>
                    )
                  }

                  if (item.type === 'meeting') {
                    const isCompleted = item.status === 'completed'
                    const isScheduled = item.status === 'scheduled' && item.scheduledDate

                    return (
                      <div
                        key={iIndex}
                        className={`py-3 px-4 bg-white border border-border/60 shadow-xs rounded-[12px] flex items-center justify-between transition-all border-l-4 ${isCompleted ? 'border-l-zinc-700' : 'border-l-zinc-900'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted/20 border border-border/30 flex flex-col items-center justify-center shrink-0">
                            <VideoIcon
                              className={`w-4 h-4 ${isCompleted ? 'text-muted-foreground/60' : 'text-zinc-600'}`}
                            />
                          </div>
                          <div className="flex flex-col mb-0.5">
                            <span className="text-[9.5px] font-bold tracking-widest text-muted-foreground uppercase leading-tight mb-0.5">
                              Reunión B2B
                            </span>
                            <h4
                              className={`font-semibold text-[13.5px] text-zinc-900 leading-tight ${isCompleted ? 'text-muted-foreground line-through decoration-muted-foreground/30 opacity-70' : ''}`}
                            >
                              {item.name}
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[12px] text-muted-foreground font-medium hidden xs:block">
                            {isScheduled
                              ? new Date(item.scheduledDate).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  timeZone: 'UTC',
                                })
                              : item.projectedMonth || 'Por definir'}
                          </span>
                          {isCompleted ? (
                            <div className="bg-[#4b4e54] w-[26px] h-[26px] rounded-[6px] flex items-center justify-center shrink-0">
                              <CheckCircle2Icon className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-border/80 bg-background text-zinc-600 h-[26px] font-medium shadow-none px-2.5"
                            >
                              Agendada
                            </Badge>
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
