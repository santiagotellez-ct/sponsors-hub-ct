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
  UploadIcon,
} from 'lucide-react'

export function EntregablesView({ sponsor }: { sponsor: any }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedDeliverable, setExpandedDeliverable] = useState<string | null>(null)

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
        if (d.id === deliverableId) {
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

      setExpandedDeliverable(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Hubo un error al guardar el entregable. Revise la consola.')
    } finally {
      setLoadingId(null)
    }
  }

  // --- LOGICA DE ESTADÍSTICAS ---
  let totalDeliverablesCount = 0
  let completedDeliverablesCount = 0
  let pendingDeliverablesCount = 0
  let blockedDeliverablesCount = 0

  let localIsPreviousComplete = true

  benefits.forEach((benefit: any) => {
    const categoryName = benefit.benefitName
    const blockDeliverables = participationDeliverables.filter(
      (d: any) => d.benefitCategory === categoryName,
    )
    const blockItems = participationItems.filter(
      (item: any) => item.benefitCategory === categoryName,
    )

    const isBlockUnlocked = isFirstMeetingReady && localIsPreviousComplete

    // Verificamos estatus de los items para desbloquear el siguiente bloque
    const isCurrentBlockComplete =
      blockItems.length > 0 && blockItems.every((item: any) => item.status === 'completed')

    blockDeliverables.forEach((d: any) => {
      totalDeliverablesCount++
      if (d.status === 'completed') {
        completedDeliverablesCount++
      } else if (!isBlockUnlocked) {
        blockedDeliverablesCount++
      } else {
        pendingDeliverablesCount++
      }
    })

    // Actualizamos variable propagada para la iteración del siguiente map()
    localIsPreviousComplete = isCurrentBlockComplete
  })

  const completedPercent =
    totalDeliverablesCount > 0
      ? Math.round((completedDeliverablesCount / totalDeliverablesCount) * 100)
      : 0

  let isPreviousBlockCompletedMap = true // Reset for actual render loop

  return (
    <>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Progreso y entregables
          </h1>
          <p className="text-muted-foreground mt-2 text-[15px]">
            Completa los requerimientos para desbloquear la ejecución de tus beneficios.
          </p>
        </div>

        {/* 4 CARDS SUPERIORES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Card className="shadow-sm border-border/80 rounded-[14px]">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground/80 tracking-wide pb-1">
                Total
              </span>
              <span className="text-3xl font-bold text-foreground">{totalDeliverablesCount}</span>
              <span className="text-xs text-muted-foreground/90 font-medium">
                Entregables del plan
              </span>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/80 rounded-[14px]">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground/80 tracking-wide pb-1">
                Completados
              </span>
              <span className="text-3xl font-bold text-foreground">
                {completedDeliverablesCount}
              </span>
              <span className="text-xs text-muted-foreground/90 font-medium">
                {completedPercent}% del total
              </span>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/80 rounded-[14px]">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground/80 tracking-wide pb-1">
                Pendientes
              </span>
              <span className="text-3xl font-bold text-foreground">{pendingDeliverablesCount}</span>
              <span className="text-xs text-muted-foreground/90 font-medium">Requieren acción</span>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/80 rounded-[14px]">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground/80 tracking-wide pb-1">
                Bloqueados
              </span>
              <span className="text-3xl font-bold text-foreground">{blockedDeliverablesCount}</span>
              <span className="text-xs text-muted-foreground/90 font-medium">
                Se desbloquean proximamente
              </span>
            </CardContent>
          </Card>
        </div>

        {!isFirstMeetingReady && firstMeeting && (
          <div className="bg-primary/10 border border-primary/20 text-primary px-6 py-4 rounded-xl flex items-start gap-4">
            <AlertCircleIcon className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Entregables Bloqueados</h3>
              <p className="text-sm mt-1 opacity-90">
                Cuando hayas <strong>agendado</strong> la reunión{' '}
                <strong>"{firstMeeting.name}"</strong> se habilitarán los primeros entregables para
                que puedas comenzar a subir tu material.
              </p>
            </div>
          </div>
        )}

        <div className="ml-2 md:ml-4 border-l-[1.5px] border-muted-foreground/20 space-y-8 mt-10">
          {benefits.map((benefit: any, index: number) => {
            const categoryName = benefit.benefitName
            const blockDeliverables = participationDeliverables.filter(
              (d: any) => d.benefitCategory === categoryName,
            )
            const blockItems = participationItems.filter(
              (item: any) => item.benefitCategory === categoryName,
            )

            const isBlockUnlocked = isFirstMeetingReady && isPreviousBlockCompletedMap
            const isCurrentBlockCompleted =
              blockItems.length > 0 && blockItems.every((item: any) => item.status === 'completed')

            isPreviousBlockCompletedMap = isCurrentBlockCompleted

            return (
              <div key={index} className="relative pl-8 md:pl-12">
                <div
                  className={`absolute -left-[14px] top-4 flex items-center justify-center w-7 h-7 rounded-full shrink-0 outline outline-4 outline-background
                  ${isCurrentBlockCompleted ? 'bg-primary text-primary-foreground' : isBlockUnlocked ? 'bg-white border border-muted-foreground/40 text-muted-foreground' : 'bg-transparent border-2 border-muted-foreground/20 text-muted-foreground/40'}
                `}
                >
                  {isCurrentBlockCompleted ? (
                    <CheckCircle2Icon className="w-3.5 h-3.5" />
                  ) : isBlockUnlocked ? (
                    <ClockIcon className="w-3.5 h-3.5" />
                  ) : (
                    <LockIcon className="w-3 h-3" />
                  )}
                </div>

                <div
                  className={`w-full max-w-4xl bg-white border border-border/60 rounded-2xl overflow-hidden transition-all duration-300 ${!isBlockUnlocked ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* HEADER DEL BLOQUE */}
                  <div className="bg-muted/30 px-5 py-4 border-b border-border/50 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <LayoutListIcon className="w-5 h-5 text-muted-foreground/70" />
                      <h3 className="text-[17px] font-bold text-zinc-900">{categoryName}</h3>
                    </div>
                    <div>
                      {!isBlockUnlocked && (
                        <Badge
                          variant="outline"
                          className="bg-transparent text-muted-foreground border-muted-foreground/30 px-3 h-7"
                        >
                          Bloqueado
                        </Badge>
                      )}
                      {isBlockUnlocked && !isCurrentBlockCompleted && (
                        <Badge
                          variant="outline"
                          className="bg-background text-zinc-600 border-border/80 px-3 h-7 font-medium"
                        >
                          En turno
                        </Badge>
                      )}
                      {isCurrentBlockCompleted && (
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 h-7">
                          <CheckCircle2Icon className="w-3.5 h-3.5 mr-1" /> Completado
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* CONTENIDO DEL BLOQUE */}
                  <div className="p-5 lg:p-7 space-y-8">
                    {/* SECCIÓN MATERIAL REQUERIDO */}
                    {benefit.hasDeliverable && blockDeliverables.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                          <UploadIcon className="w-3.5 h-3.5" /> Material Requerido
                        </h4>
                        <div className="space-y-3">
                          {blockDeliverables.map((deliv: any, dIndex: number) => {
                            const isPending =
                              deliv.status === 'pending' || deliv.status === 'overdue'

                            return (
                              <div key={deliv.id || dIndex}>
                                {isPending ? (
                                  <div className="flex flex-col border border-border/60 rounded-xl bg-background shadow-xs overflow-hidden transition-all max-w-3xl">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 gap-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center shrink-0">
                                          {deliv.type === 'document' || deliv.type === 'direct' ? (
                                            <FileTextIcon className="w-5 h-5 text-muted-foreground/80" />
                                          ) : (
                                            <ImageIcon className="w-5 h-5 text-muted-foreground/80" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-[13.5px] text-zinc-900">
                                            {deliv.itemName}
                                          </p>
                                          <p className="text-[11.5px] text-muted-foreground mt-0.5">
                                            Vence{' '}
                                            <span className="font-medium">
                                              {new Date(deliv.dueDate).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                              })}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                        <Badge
                                          variant="outline"
                                          className="text-amber-600 border-amber-300 bg-amber-50 h-7 px-3 text-xs font-medium"
                                        >
                                          Pendiente
                                        </Badge>
                                        {deliv.type !== 'direct' && (
                                          <Button
                                            className="bg-primary text-primary-foreground h-7 text-xs px-4"
                                            onClick={() =>
                                              setExpandedDeliverable(
                                                expandedDeliverable === deliv.id ? null : deliv.id,
                                              )
                                            }
                                          >
                                            {expandedDeliverable === deliv.id
                                              ? 'Cancelar'
                                              : 'Enviar'}
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    {/* EXPANDABLE UPLOAD AREA */}
                                    {expandedDeliverable === deliv.id && (
                                      <div className="p-4 bg-muted/10 border-t flex flex-col md:flex-row gap-3 items-end">
                                        <div className="w-full">
                                          {(deliv.type === 'document' ||
                                            deliv.type === 'image') && (
                                            <Input
                                              type="file"
                                              className="bg-white"
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
                                              placeholder="Ingrese la información solicitada aquí..."
                                              className="min-h-[80px] bg-white"
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
                                              className="bg-white"
                                              disabled={!isBlockUnlocked || loadingId === deliv.id}
                                              onChange={(e) =>
                                                setLinkInputs({
                                                  ...linkInputs,
                                                  [deliv.id]: e.target.value,
                                                })
                                              }
                                            />
                                          )}
                                        </div>
                                        <Button
                                          className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                                          disabled={loadingId === deliv.id}
                                          onClick={() =>
                                            handleSubmitDeliverable(
                                              deliv.id,
                                              categoryName,
                                              deliv.type,
                                            )
                                          }
                                        >
                                          {loadingId === deliv.id ? (
                                            <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                                          ) : (
                                            'Confirmar Envío'
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-border/50 rounded-xl bg-background shadow-xs max-w-3xl">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                        <FileTextIcon className="w-5 h-5 text-emerald-600/70" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-[13.5px] text-zinc-900">
                                          {deliv.itemName}
                                        </p>
                                        <p className="text-[11.5px] text-muted-foreground mt-0.5">
                                          Vence{' '}
                                          <span className="font-medium">
                                            {new Date(deliv.dueDate).toLocaleDateString('es-ES', {
                                              day: 'numeric',
                                              month: 'short',
                                            })}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                      <Badge
                                        variant="outline"
                                        className="text-emerald-700 border-emerald-300 bg-emerald-50 h-7 px-3 text-xs font-medium"
                                      >
                                        <CheckCircle2Icon className="w-3 h-3 mr-1.5" /> Enviado
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* SECCIÓN PROGRESO DE BENEFICIOS */}
                    {blockItems.length > 0 && (
                      <div className="space-y-4 pt-2">
                        <h4 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                          Progreso de Beneficios (
                          {blockItems.filter((i: any) => i.status === 'completed').length}/
                          {blockItems.length})
                        </h4>
                        <div className="space-y-2 max-w-3xl">
                          {blockItems.map((item: any, iIndex: number) => {
                            const hasEvidences = item.evidences && item.evidences.length > 0

                            return (
                              <div
                                key={iIndex}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-[10px] border border-border/60 bg-background text-sm shadow-xs"
                              >
                                <div className="flex items-center gap-3">
                                  {item.status === 'completed' ? (
                                    <div className="w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                                      <CheckCircle2Icon className="w-[11px] h-[11px]" />
                                    </div>
                                  ) : (
                                    <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-muted-foreground/30 bg-muted/10 shrink-0" />
                                  )}
                                  <span className="font-medium text-foreground text-[13.5px]">
                                    {item.itemName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  {hasEvidences && (
                                    <button
                                      onClick={() => setEvidenceItem(item)}
                                      className="text-[12px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                                    >
                                      <EyeIcon className="w-3.5 h-3.5 opacity-70" />
                                      Evidencia
                                    </button>
                                  )}

                                  {item.status === 'completed' && (
                                    <Badge className="bg-primary text-primary-foreground min-w-[90px] justify-center text-[11px] h-6 px-2.5 rounded-md hover:bg-primary/90">
                                      Completado
                                    </Badge>
                                  )}
                                  {item.status === 'in_progress' && (
                                    <Badge
                                      variant="outline"
                                      className="text-amber-700 border-amber-300 bg-amber-50/50 min-w-[90px] justify-center text-[11px] h-6 px-2.5 rounded-md shadow-none"
                                    >
                                      En progreso
                                    </Badge>
                                  )}
                                  {item.status === 'not_started' && (
                                    <div className="text-muted-foreground/60 text-[11.5px] font-medium min-w-[90px] text-right pr-1">
                                      No iniciado
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL EVIDENCIAS */}
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
