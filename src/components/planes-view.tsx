'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, ArrowLeftIcon, CheckCircle2Icon, PackageIcon, CalendarIcon } from 'lucide-react'

export function PlanesView({ sponsor }: { sponsor: any }) {
  const [selectedParticipation, setSelectedParticipation] = useState<any | null>(null)

  const participations = sponsor.eventParticipations || []

  if (participations.length === 0) {
    return (
      <div className="text-center p-10 bg-muted/20 border rounded-xl mt-10">
        <PackageIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
        <p className="text-lg font-medium">Aún no tienes planes asignados</p>
        <p className="text-sm text-muted-foreground mt-1">
          Cuando adquieras un plan de patrocinio aparecerá aquí.
        </p>
      </div>
    )
  }

  // --- VISTA DE DETALLE DEL PLAN ---
  if (selectedParticipation) {
    const event = selectedParticipation.event
    const plan = selectedParticipation.plan
    const benefits = plan?.benefits || []
    const bgImageUrl = event?.backgroundImage?.url
    const isActive = selectedParticipation.isCurrent

    const startDate = event?.startDate ? new Date(event.startDate) : null
    const endDate = event?.endDate ? new Date(event.endDate) : null
    const benefitCount = benefits.length

    const dateText = startDate
      ? `${startDate.getDate()}${endDate && endDate.getTime() !== startDate.getTime() ? ` \u2014 ${endDate.getDate()}` : ''} ${startDate.toLocaleDateString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + startDate.toLocaleDateString('es-ES', { month: 'long' }).slice(1)}, ${startDate.getFullYear()}`
      : 'Por confirmar'

    return (
      <div className="space-y-7 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* VOLVER */}
        <Button
          variant="ghost"
          className="-ml-3 text-muted-foreground hover:text-foreground text-[13px]"
          onClick={() => setSelectedParticipation(null)}
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
          Volver a mis planes
        </Button>

        {/* BANNER SUPERIOR */}
        <div className="relative h-[200px] rounded-2xl overflow-hidden border border-border/40 shadow-sm">
          {/* Imagen de fondo con blur */}
          {bgImageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center scale-110"
              style={{ backgroundImage: `url(${bgImageUrl})`, filter: 'blur(6px)' }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a2540] to-[#0f172a]" />
          )}
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Badge evento activo */}
          {isActive && (
            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11.5px] font-semibold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                Evento activo
              </span>
            </div>
          )}

          {/* Texto sobre el banner */}
          <div className="absolute bottom-0 left-0 px-7 pb-6 z-10">
            <p className="text-[10.5px] font-bold tracking-[0.16em] text-white/70 uppercase mb-1.5">
              Plan {plan?.name || '\u2014'}
            </p>
            <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight drop-shadow">
              {event?.title || 'Evento'}
            </h1>
          </div>
        </div>

        {/* TARJETAS DE INFO */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border/60 rounded-xl px-5 py-4 bg-white shadow-xs">
            <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground font-medium mb-2">
              <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
              Fechas
            </div>
            <p className="text-[16px] font-bold text-zinc-900">{dateText}</p>
          </div>
          <div className="border border-border/60 rounded-xl px-5 py-4 bg-white shadow-xs">
            <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground font-medium mb-2">
              <PackageIcon className="w-3.5 h-3.5 opacity-70" />
              Beneficios
            </div>
            <p className="text-[16px] font-bold text-zinc-900">
              {benefitCount} categor{benefitCount === 1 ? 'ía' : 'ías'}
            </p>
          </div>
        </div>

        {/* BENEFICIOS INCLUIDOS */}
        <div>
          <h2 className="text-[17px] font-bold text-zinc-900 mb-4">Beneficios incluidos</h2>

          {benefits.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit: any, index: number) => {
                const items = benefit.items || []
                return (
                  <div
                    key={index}
                    className="border border-border/60 rounded-xl px-5 py-4 bg-white shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[14.5px] font-bold text-zinc-900">{benefit.benefitName}</h3>
                      <span className="text-[12px] text-muted-foreground font-medium">
                        {items.length}/{items.length}
                      </span>
                    </div>
                    {items.length > 0 ? (
                      <ul className="space-y-2">
                        {items.map((item: any, iIndex: number) => (
                          <li key={iIndex} className="flex items-start gap-2.5 text-[13px] text-teal-600">
                            <CheckCircle2Icon className="w-[15px] h-[15px] shrink-0 mt-0.5 opacity-80" />
                            <span>{item.itemName}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Sin ítems configurados.</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 border rounded-xl bg-muted/20 text-center">
              <p className="text-muted-foreground">Este plan no tiene beneficios configurados.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- VISTA DE CUADRÍCULA (GRID) ---
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Mis planes</h1>
        <p className="text-muted-foreground mt-2 text-[15px]">
          Selecciona un evento para ver los beneficios detallados de tu plan de patrocinio.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-6">
        {participations.map((participation: any, index: number) => {
          const event = participation.event
          const plan = participation.plan
          const bgImageUrl = event?.backgroundImage?.url
          const isActive = participation.isCurrent

          const startDate = event?.startDate ? new Date(event.startDate) : null
          const endDate = event?.endDate ? new Date(event.endDate) : null
          const benefitCount = plan?.benefits?.length || 0

          const dateText = startDate
            ? `${startDate.getDate()}${endDate && endDate.getTime() !== startDate.getTime() ? ` — ${endDate.getDate()}` : ''} ${startDate.toLocaleDateString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + startDate.toLocaleDateString('es-ES', { month: 'long' }).slice(1)}, ${startDate.getFullYear()}`
            : null

          return (
            <div
              key={index}
              className="group flex flex-col rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white cursor-pointer hover:-translate-y-0.5"
              onClick={() => setSelectedParticipation(participation)}
            >
              {/* BANNER SUPERIOR — imagen del evento o gradiente fallback */}
              <div className="relative h-[160px] overflow-hidden">
                {bgImageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${bgImageUrl})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-950 transition-transform duration-700 group-hover:scale-105" />
                )}

                {/* Badge activo */}
                {isActive && (
                  <div className="absolute top-3.5 left-3.5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-zinc-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Activo
                    </span>
                  </div>
                )}

                {/* Nombre del plan sobre la imagen */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5 pt-8 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-white/90 uppercase">
                    Plan {plan?.name || '—'}
                  </p>
                </div>
              </div>

              {/* SECCIÓN INFERIOR — info blanca */}
              <div className="flex flex-col gap-3 px-4 py-4">
                <div>
                  <h2 className="text-[15.5px] font-bold text-zinc-900 leading-snug">
                    {event?.title || 'Evento'}
                  </h2>
                  {dateText && (
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">{dateText}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <span className="text-[12.5px] text-muted-foreground">
                    {benefitCount} beneficio{benefitCount !== 1 ? 's' : ''}
                  </span>
                  <button
                    className="text-[12.5px] font-semibold text-zinc-900 flex items-center gap-1 hover:gap-2 transition-all"
                    onClick={() => setSelectedParticipation(participation)}
                  >
                    Ver plan <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
