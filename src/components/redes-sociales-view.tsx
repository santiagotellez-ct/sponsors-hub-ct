'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Share2Icon,
  DownloadIcon,
  ExternalLinkIcon,
  CalendarIcon,
  ClipboardIcon,
  CheckIcon,
  ImageIcon,
  FileTextIcon,
  LinkIcon,
} from 'lucide-react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
      title="Copiar copy"
    >
      {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
    </button>
  )
}

const FORMAT_LABELS: Record<string, string> = {
  imagen: 'Imagen',
  pdf: 'PDF',
  link: 'Link',
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  imagen: <ImageIcon className="w-8 h-8 text-zinc-500" />,
  pdf: <FileTextIcon className="w-8 h-8 text-zinc-500" />,
  link: <LinkIcon className="w-8 h-8 text-zinc-500" />,
}

export function RedesSocialesView({ sponsor }: { sponsor: any }) {
  const activeParticipation = sponsor?.eventParticipations?.find((p: any) => p.isCurrent)
  const items: any[] = activeParticipation?.redesSociales || []

  // Cada item tiene { pieza: PiezaRedesSociales } (populado con depth:2)
  const piezas = items
    .map((item: any) => (typeof item.pieza === 'object' ? item.pieza : null))
    .filter(Boolean)

  if (piezas.length === 0) {
    return (
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Redes Sociales</h1>
          <p className="text-muted-foreground mt-2">
            Piezas gráficas y contenido preparado por el equipo de Colombia Tech para tu empresa.
          </p>
        </div>
        <div className="text-center p-10 bg-muted/20 border rounded-xl mt-10">
          <Share2Icon className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <p className="text-lg font-medium">No hay piezas disponibles aún</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aquí aparecerán las piezas de redes sociales que el equipo de Colombia Tech prepare para
            tu empresa.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Redes Sociales</h1>
        <p className="text-muted-foreground mt-2">
          Piezas gráficas y contenido preparado por el equipo de Colombia Tech para tu empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {piezas.map((pieza: any, index: number) => {
          const formato = pieza.formatoTipo || 'imagen'
          const archivoUrl = pieza.url || null
          const isImage = formato === 'imagen'
          const isPdf = formato === 'pdf'
          const isLink = formato === 'link'

          const fechaPublicacion = pieza.fechaPublicacion
            ? new Date(pieza.fechaPublicacion).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : null

          return (
            <Card key={pieza.id || index} className="group hover:border-zinc-900 transition-colors shadow-sm flex flex-col">
              {/* Thumbnail de imagen */}
              {isImage && archivoUrl ? (
                <div className="relative overflow-hidden rounded-t-xl bg-muted aspect-video">
                  <img
                    src={archivoUrl}
                    alt={pieza.nombre}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center aspect-video bg-muted/40 rounded-t-xl">
                  {FORMAT_ICONS[formato]}
                </div>
              )}

              <CardContent className="p-5 flex flex-col flex-1 gap-3">
                {/* Nombre y badge de formato */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-snug line-clamp-2">{pieza.nombre}</h3>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {FORMAT_LABELS[formato] || formato}
                  </Badge>
                </div>

                {/* Fecha sugerida de publicación */}
                {fechaPublicacion && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>Publicar el {fechaPublicacion}</span>
                  </div>
                )}

                {/* Copy sugerido */}
                {pieza.copySugerido && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <p className="whitespace-pre-wrap line-clamp-4 leading-relaxed">{pieza.copySugerido}</p>
                      <CopyButton text={pieza.copySugerido} />
                    </div>
                  </div>
                )}

                {/* Botón de acción */}
                <div className="mt-auto pt-1">
                  {(isImage || isPdf) && archivoUrl ? (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      <a href={archivoUrl} target="_blank" rel="noopener noreferrer" download>
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Descargar {isPdf ? 'PDF' : 'Imagen'}
                      </a>
                    </Button>
                  ) : isLink && pieza.urlLink ? (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      <a href={pieza.urlLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLinkIcon className="w-4 h-4 mr-2" />
                        Abrir Link
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Sin archivo disponible
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
