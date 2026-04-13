'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  LockIcon,
  CheckCircle2Icon,
  UploadCloudIcon,
  Loader2Icon,
  AlertCircleIcon,
  ClockIcon,
  LayoutListIcon,
  EyeIcon,
  ImageIcon,
  FileTextIcon,
  ExternalLinkIcon,
  AlignLeftIcon,
} from 'lucide-react'

export function EntregablesView({ sponsor }: { sponsor: any }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Estados para manejar los inputs de los entregables
  const [fileInputs, setFileInputs] = useState<Record<string, File | null>>({})
  const [textInputs, setTextInputs] = useState<Record<string, string>>({})
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({})

  // Estado para controlar qué evidencia se está viendo en el modal
  const [evidenceItem, setEvidenceItem] = useState<any | null>(null)

  const activeParticipationIndex = sponsor.eventParticipations?.findIndex((p: any) => p.isCurrent)
  const activeParticipation = sponsor.eventParticipations?.[activeParticipationIndex]

  if (!activeParticipation || !activeParticipation.plan) {
    return (
      <div className="text-center p-10 text-muted-foreground">
        No tienes un plan o evento activo asignado.
      </div>
    )
  }

  const meetings = activeParticipation.meetings || []
  const firstMeeting = meetings.length > 0 ? meetings[0] : null
  const isFirstMeetingReady = firstMeeting
    ? firstMeeting.status === 'completed' || firstMeeting.status === 'scheduled'
    : true

  const plan = activeParticipation.plan
  const benefits = plan.benefits || []
  const participationDeliverables = activeParticipation.deliverables || []
  const participationItems = activeParticipation.benefitItems || []

  const handleSubmitDeliverable = async (
    deliverableId: string,
    categoryName: string,
    type: string,
  ) => {
    setLoadingId(deliverableId)
    try {
      let uploadedFileId = null

      if (type === 'document' || type === 'image') {
        const file = fileInputs[deliverableId]
        if (!file) throw new Error('Debe seleccionar un archivo')

        const formData = new FormData()
        formData.append('file', file)
        const mediaRes = await fetch('/api/media', { method: 'POST', body: formData })
        if (!mediaRes.ok) throw new Error('Error subiendo el archivo')
        const mediaData = await mediaRes.json()
        uploadedFileId = mediaData.doc.id
      }

      const updatedParticipations = [...sponsor.eventParticipations]
      const currentPart = updatedParticipations[activeParticipationIndex]

      currentPart.event =
        typeof currentPart.event === 'object' ? currentPart.event.id : currentPart.event
      currentPart.plan =
        typeof currentPart.plan === 'object' ? currentPart.plan.id : currentPart.plan

      currentPart.deliverables = currentPart.deliverables.map((d: any) => {
        if (
          d.id === deliverableId ||
          (d.benefitCategory === categoryName && d.type === type && d.status === 'pending')
        ) {
          return {
            ...d,
            status: 'completed',
            uploadedFile: uploadedFileId || d.uploadedFile,
            uploadedText: textInputs[deliverableId] || d.uploadedText,
            uploadedLink: linkInputs[deliverableId] || d.uploadedLink,
          }
        }
        return d
      })

      currentPart.benefitItems = currentPart.benefitItems.map((item: any) => {
        if (item.benefitCategory === categoryName && item.status === 'not_started') {
          return { ...item, status: 'in_progress' }
        }
        return item
      })

      const updateRes = await fetch(`/api/sponsors/${sponsor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventParticipations: updatedParticipations }),
      })

      if (!updateRes.ok) throw new Error('Error actualizando la base de datos')

      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Hubo un error al guardar el entregable. Revise la consola.')
    } finally {
      setLoadingId(null)
    }
  }

  let isPreviousBlockCompleted = true

  return (
    <>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progreso y Entregables</h1>
          <p className="text-muted-foreground mt-2">
            Complete los requerimientos para desbloquear la ejecución de sus beneficios.
          </p>
        </div>

        {!isFirstMeetingReady && firstMeeting && (
          <div className="bg-primary/10 border border-primary/20 text-primary px-6 py-4 rounded-lg flex items-start gap-4">
            <AlertCircleIcon className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Entregables Bloqueados</h3>
              <p className="text-sm mt-1 opacity-90">
                Cuando haya <strong>agendado</strong> la reunión{' '}
                <strong>"{firstMeeting.name}"</strong> se habilitarán los primeros entregables para
                que pueda comenzar a subir su material.
              </p>
            </div>
          </div>
        )}

        <div className="ml-2 md:ml-4 border-l-2 border-muted-foreground/20 space-y-10 mt-8">
          {benefits.map((benefit: any, index: number) => {
            const categoryName = benefit.benefitName
            const blockDeliverables = participationDeliverables.filter(
              (d: any) => d.benefitCategory === categoryName,
            )
            const blockItems = participationItems.filter(
              (item: any) => item.benefitCategory === categoryName,
            )

            const isBlockUnlocked = isFirstMeetingReady && isPreviousBlockCompleted

            const isCurrentBlockCompleted =
              blockItems.length > 0 && blockItems.every((item: any) => item.status === 'completed')

            isPreviousBlockCompleted = isCurrentBlockCompleted

            return (
              <div key={index} className="relative pl-8 md:pl-10">
                <div
                  className={`absolute -left-[17px] top-1 flex items-center justify-center w-8 h-8 rounded-full border-4 border-background shrink-0
                  ${isCurrentBlockCompleted ? 'bg-zinc-900 text-white' : isBlockUnlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
                `}
                >
                  {isCurrentBlockCompleted ? (
                    <CheckCircle2Icon className="w-4 h-4" />
                  ) : isBlockUnlocked ? (
                    <ClockIcon className="w-4 h-4" />
                  ) : (
                    <LockIcon className="w-3 h-3" />
                  )}
                </div>

                <Card
                  className={`w-full max-w-3xl shadow-sm transition-opacity ${!isBlockUnlocked ? 'opacity-60 grayscale-[50%]' : ''}`}
                >
                  <CardHeader className="bg-muted/30 pb-4 border-b">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2">
                        <LayoutListIcon className="w-5 h-5 text-muted-foreground" />
                        <CardTitle className="text-xl">{categoryName}</CardTitle>
                      </div>
                      {!isBlockUnlocked && (
                        <Badge variant="secondary" className="bg-muted-foreground/20">
                          <LockIcon className="w-3 h-3 mr-1" /> Bloqueado
                        </Badge>
                      )}
                      {isBlockUnlocked && !isCurrentBlockCompleted && (
                        <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">
                          En Turno
                        </Badge>
                      )}
                      {isCurrentBlockCompleted && (
                        <Badge className="bg-zinc-900 text-white hover:bg-zinc-800">
                          Completado
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-6">
                    {benefit.hasDeliverable && blockDeliverables.length > 0 && (
                      <div className="space-y-4 bg-muted/10 p-5 rounded-lg border border-dashed">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-4 text-foreground/80">
                          <UploadCloudIcon className="w-4 h-4" /> Material Requerido
                        </h4>
                        {blockDeliverables.map((deliv: any, dIndex: number) => {
                          const isPending = deliv.status === 'pending' || deliv.status === 'overdue'

                          return (
                            <div
                              key={deliv.id || dIndex}
                              className="space-y-3 pb-3 border-b last:border-0 last:pb-0"
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <Label className="text-base font-medium">{deliv.itemName}</Label>
                                <Badge
                                  variant="outline"
                                  className="w-fit text-xs font-mono bg-background"
                                >
                                  Máx: {new Date(deliv.dueDate).toLocaleDateString('es-ES')}
                                </Badge>
                              </div>

                              {isPending ? (
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end pt-2">
                                  <div className="space-y-2 w-full">
                                    {(deliv.type === 'document' || deliv.type === 'image') && (
                                      <Input
                                        type="file"
                                        disabled={!isBlockUnlocked || loadingId === deliv.id}
                                        onChange={(e) =>
                                          setFileInputs({
                                            ...fileInputs,
                                            [deliv.id]: e.target.files?.[0] || null,
                                          })
                                        }
                                      />
                                    )}
                                    {deliv.type === 'text' && (
                                      <Textarea
                                        placeholder="Ingrese el texto o información solicitada..."
                                        className="min-h-[80px]"
                                        disabled={!isBlockUnlocked || loadingId === deliv.id}
                                        onChange={(e) =>
                                          setTextInputs({
                                            ...textInputs,
                                            [deliv.id]: e.target.value,
                                          })
                                        }
                                      />
                                    )}
                                    {deliv.type === 'link' && (
                                      <Input
                                        type="url"
                                        placeholder="https://ejemplo.com"
                                        disabled={!isBlockUnlocked || loadingId === deliv.id}
                                        onChange={(e) =>
                                          setLinkInputs({
                                            ...linkInputs,
                                            [deliv.id]: e.target.value,
                                          })
                                        }
                                      />
                                    )}
                                    {deliv.type === 'direct' && (
                                      <p className="text-sm text-muted-foreground border p-3 rounded-md bg-background">
                                        Este entregable se coordinará directamente por WhatsApp o
                                        Email corporativo.
                                      </p>
                                    )}
                                  </div>

                                  {deliv.type !== 'direct' && (
                                    <Button
                                      className="bg-zinc-900 text-white w-full md:w-auto"
                                      disabled={!isBlockUnlocked || loadingId === deliv.id}
                                      onClick={() =>
                                        handleSubmitDeliverable(deliv.id, categoryName, deliv.type)
                                      }
                                    >
                                      {loadingId === deliv.id ? (
                                        <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                                      ) : (
                                        'Enviar'
                                      )}
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center text-sm text-green-700 bg-green-50/50 px-4 py-3 rounded-md border border-green-200 mt-2">
                                  <CheckCircle2Icon className="w-5 h-5 mr-3 shrink-0" />
                                  <span>Entregable recibido y registrado exitosamente.</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {blockItems.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-sm font-semibold text-foreground/80 mb-3">
                          Progreso de Beneficios
                        </h4>
                        <div className="grid gap-2">
                          {blockItems.map((item: any, iIndex: number) => {
                            // Validamos si este item en particular tiene evidencias cargadas
                            const hasEvidences = item.evidences && item.evidences.length > 0

                            return (
                              <div
                                key={iIndex}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-background text-sm shadow-sm"
                              >
                                <span className="font-medium text-foreground">{item.itemName}</span>
                                <div className="flex items-center gap-3">
                                  {/* BOTÓN PARA VER EVIDENCIAS (Aparece solo si hay) */}
                                  {hasEvidences && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => setEvidenceItem(item)}
                                    >
                                      <EyeIcon className="w-3.5 h-3.5 mr-1.5" />
                                      Ver Evidencia
                                    </Button>
                                  )}

                                  {item.status === 'completed' && (
                                    <Badge className="bg-zinc-900 text-white w-fit">
                                      Completado
                                    </Badge>
                                  )}
                                  {item.status === 'in_progress' && (
                                    <Badge
                                      variant="outline"
                                      className="text-amber-600 border-amber-300 bg-amber-50 w-fit"
                                    >
                                      En progreso
                                    </Badge>
                                  )}
                                  {item.status === 'not_started' && (
                                    <Badge variant="secondary" className="opacity-60 w-fit">
                                      No iniciado
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL (DIALOG) PARA MOSTRAR LAS EVIDENCIAS */}
      <Dialog open={!!evidenceItem} onOpenChange={(open) => !open && setEvidenceItem(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Evidencias: {evidenceItem?.itemName}</DialogTitle>
            <DialogDescription>
              Material respaldatorio subido por el equipo de Colombia Tech.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {evidenceItem?.evidences?.map((ev: any, idx: number) => {
              const fileUrl = typeof ev.file === 'object' ? ev.file?.url : null

              return (
                <div key={idx} className="space-y-2 border rounded-lg p-4 bg-muted/20">
                  {/* TIPO: IMAGEN */}
                  {ev.type === 'image' && fileUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <ImageIcon className="w-4 h-4" /> Imagen adjunta
                      </div>
                      <div className="rounded-md overflow-hidden border bg-background flex justify-center p-2">
                        <img
                          src={fileUrl}
                          alt="Evidencia"
                          className="max-w-full max-h-[300px] object-contain rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* TIPO: DOCUMENTO */}
                  {ev.type === 'document' && fileUrl && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-background border rounded-md">
                      <div className="flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">Documento adjunto</span>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          Abrir archivo <ExternalLinkIcon className="w-3 h-3 ml-2" />
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* TIPO: TEXTO */}
                  {ev.type === 'text' && ev.text && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <AlignLeftIcon className="w-4 h-4" /> Comentario / Nota
                      </div>
                      <div className="text-sm p-3 bg-background border rounded-md whitespace-pre-wrap">
                        {ev.text}
                      </div>
                    </div>
                  )}

                  {/* TIPO: LINK */}
                  {ev.type === 'link' && ev.link && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <ExternalLinkIcon className="w-4 h-4" /> Enlace externo
                      </div>
                      <a
                        href={ev.link.startsWith('http') ? ev.link : `https://${ev.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 p-2 bg-background border rounded-md break-all"
                      >
                        {ev.link}
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
