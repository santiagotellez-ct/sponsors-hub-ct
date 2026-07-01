'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileTextIcon, DownloadIcon, FileIcon, LinkIcon, ExternalLinkIcon } from 'lucide-react'

type DocItem = {
  name: string
  tipo: string
  file?: any
  url?: string
  isGlobal?: boolean
}

export function DocumentosView({
  sponsor,
  globalResources = [],
}: {
  sponsor: any
  globalResources?: any[]
}) {
  const ownDocs: DocItem[] = (sponsor.documents || []).map((d: any) => ({ ...d, isGlobal: false }))

  const globalDocs: DocItem[] = globalResources.map((r: any) => ({
    name: r.nombre,
    tipo: r.tipo,
    file: r.file,
    url: r.url,
    isGlobal: true,
  }))

  const allDocs = [...ownDocs, ...globalDocs]

  if (allDocs.length === 0) {
    return (
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recursos</h1>
          <p className="text-muted-foreground mt-2">
            Archivos y enlaces oficiales de tu patrocinio.
          </p>
        </div>
        <div className="text-center p-10 bg-muted/20 border rounded-xl mt-10">
          <FileTextIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <p className="text-lg font-medium">No hay recursos disponibles</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aquí aparecerán los archivos y enlaces que el equipo de Colombia Tech comparta con tu
            empresa.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recursos</h1>
        <p className="text-muted-foreground mt-2">
          Archivos y enlaces oficiales de tu patrocinio.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
        {allDocs.map((doc, index) => {
          const isUrl = doc.tipo === 'url'
          const fileUrl = isUrl
            ? doc.url
            : typeof doc.file === 'object'
              ? doc.file?.url
              : null

          return (
            <Card key={index} className="group hover:border-zinc-900 transition-colors shadow-sm">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:bg-zinc-100 transition-colors">
                  {isUrl ? (
                    <LinkIcon className="w-8 h-8 text-zinc-700" />
                  ) : (
                    <FileIcon className="w-8 h-8 text-zinc-700" />
                  )}
                </div>

                <h3 className="font-semibold text-lg line-clamp-2 mb-2 min-h-[3.5rem] flex items-center justify-center">
                  {doc.name}
                </h3>

                {doc.isGlobal && (
                  <Badge variant="secondary" className="mb-3 text-xs">
                    Compartido
                  </Badge>
                )}

                {fileUrl ? (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-auto"
                  >
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={!isUrl}>
                      {isUrl ? (
                        <>
                          <ExternalLinkIcon className="w-4 h-4 mr-2" />
                          Abrir Link
                        </>
                      ) : (
                        <>
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Ver / Descargar
                        </>
                      )}
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full mt-auto" disabled>
                    Sin archivo
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
