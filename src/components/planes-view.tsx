'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, ArrowLeftIcon, CheckCircle2Icon, PackageIcon } from 'lucide-react'

export function PlanesView({ sponsor }: { sponsor: any }) {
  // Estado para controlar si vemos la cuadrícula o el detalle de un plan
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

    return (
      <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <Button
            variant="ghost"
            className="mb-4 -ml-4 text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedParticipation(null)}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Volver a Mis Planes
          </Button>

          <h1 className="text-3xl font-bold tracking-tight">Plan {plan?.name || 'Asignado'}</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Evento: {event?.title || 'Evento Desconocido'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {benefits.length > 0 ? (
            benefits.map((benefit: any, index: number) => (
              <Card key={index} className="shadow-sm border-l-4 border-l-zinc-900">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">{benefit.benefitName}</h3>

                  {benefit.items && benefit.items.length > 0 ? (
                    <ul className="space-y-3">
                      {benefit.items.map((item: any, iIndex: number) => (
                        <li key={iIndex} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle2Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="font-medium text-foreground/80">{item.itemName}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Este beneficio no tiene ítems detallados.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 border rounded-xl bg-muted/20 text-center">
              <p className="text-muted-foreground">
                Este plan no tiene beneficios detallados configurados.
              </p>
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
        <h1 className="text-3xl font-bold tracking-tight">Mis Planes</h1>
        <p className="text-muted-foreground mt-2">
          Seleccione un evento para ver los beneficios detallados de su plan de patrocinio.
        </p>
      </div>

      {/* GRID DE 3 COLUMNAS MÁXIMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
        {participations.map((participation: any, index: number) => {
          const event = participation.event
          const bgImageUrl = event?.backgroundImage?.url

          return (
            <button
              key={index}
              onClick={() => setSelectedParticipation(participation)}
              className="group relative flex flex-col text-left w-full h-[300px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
            >
              {/* IMAGEN DE FONDO */}
              {bgImageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${bgImageUrl})` }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 transition-transform duration-700 group-hover:scale-105" />
              )}

              {/* OVERLAY OSCURO PARA LEGIBILIDAD */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

              {/* CONTENIDO SUPERIOR: EVENTO */}
              <div className="relative z-10 p-6 flex-1">
                {participation.isCurrent && (
                  <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full mb-3 shadow-sm">
                    EVENTO ACTUAL
                  </span>
                )}
                <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-md">
                  {event?.title || 'Evento'}
                </h2>
              </div>

              {/* CONTENIDO INFERIOR: BOTÓN MI PLAN */}
              <div className="relative z-10 p-6 w-full mt-auto">
                <div className="flex items-center justify-between text-white/90 group-hover:text-white border-t border-white/20 pt-4">
                  <span className="font-semibold tracking-wide uppercase text-sm">Mi plan</span>
                  <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
