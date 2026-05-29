'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  LockIcon,
  CheckCircle2Icon,
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
  LinkIcon,
  ClipboardListIcon,
} from 'lucide-react'

function deliverableIcon(type: string) {
  if (type === 'image') return <ImageIcon className="w-5 h-5 text-muted-foreground/80" />
  if (type === 'text') return <AlignLeftIcon className="w-5 h-5 text-muted-foreground/80" />
  if (type === 'link') return <LinkIcon className="w-5 h-5 text-muted-foreground/80" />
  if (type === 'action_link')
    return <ExternalLinkIcon className="w-5 h-5 text-muted-foreground/80" />
  if (type === 'formulario')
    return <ClipboardListIcon className="w-5 h-5 text-muted-foreground/80" />
  return <FileTextIcon className="w-5 h-5 text-muted-foreground/80" />
}

export function EntregablesView({ sponsor }: { sponsor: any }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedDeliverable, setExpandedDeliverable] = useState<string | null>(null)
  const [fileInputs, setFileInputs] = useState<Record<string, File | null>>({})
  const [textInputs, setTextInputs] = useState<Record<string, string>>({})
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({})
  const [visitedLinks, setVisitedLinks] = useState<Record<string, boolean>>({})
  const [formInputs, setFormInputs] = useState<Record<string, Record<string, any>>>({})
  const [formFileInputs, setFormFileInputs] = useState<Record<string, Record<string, File | null>>>({})
  const [activeFormDeliverable, setActiveFormDeliverable] = useState<any | null>(null)
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

  const plan = activeParticipation.plan
  const benefits = plan.benefits || []
  const participationDeliverables = activeParticipation.deliverables || []
  const participationItems = activeParticipation.benefitItems || []

  // Categorías ordenadas sin duplicados
  const planBenefitNames = benefits.map((b: any) => b.benefitName)
  const allUsedCats = [
    ...participationDeliverables.map((d: any) => d.benefitCategory),
    ...participationItems.map((i: any) => i.benefitCategory),
  ]
  const planCategories = planBenefitNames.filter((cat: string) => allUsedCats.includes(cat))
  const customCategories = [...new Set(allUsedCats)].filter(
    (cat) => !planBenefitNames.includes(cat),
  )
  const orderedCategories = [...new Set([...planCategories, ...customCategories])]

  // Logo check (gateway de desbloqueo)
  const logoDeliverables = participationDeliverables.filter((d: any) =>
    d.itemName.toLowerCase().includes('logo'),
  )
  const isLogoCompleted =
    logoDeliverables.length === 0 || logoDeliverables.every((d: any) => d.status === 'completed')

  const handleSubmitDeliverable = async (
    deliverableId: string,
    relatedItemNames: { itemName: string }[],
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

      // For formulario: process image fields before saving
      let formResponseData: Record<string, any> | null = null
      if (type === 'formulario') {
        const deliverable = activeParticipation.deliverables?.find(
          (d: any) => d.id === deliverableId,
        )
        const formDef = typeof deliverable?.formId === 'object' ? deliverable.formId : null
        const responses = { ...(formInputs[deliverableId] || {}) }

        if (formDef?.fields) {
          for (const field of formDef.fields as any[]) {
            if (field.type === 'image') {
              const file = formFileInputs[deliverableId]?.[field.fieldKey]
              if (file) {
                const fd = new FormData()
                fd.append('file', file)
                const mediaRes = await fetch('/api/media', { method: 'POST', body: fd })
                if (!mediaRes.ok) throw new Error(`Error subiendo imagen para "${field.label}"`)
                const mediaData = await mediaRes.json()
                responses[field.fieldKey] = { id: mediaData.doc.id, url: mediaData.doc.url }
              }
            }
          }
        }
        formResponseData = responses
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
            formResponse: type === 'formulario' ? formResponseData : d.formResponse,
          }
        }
        return d
      })

      // Marcar ítems vinculados como in_progress (soporta string[] y [{itemName}][])
      const linkedNames = (relatedItemNames || []).map((r: any) =>
        typeof r === 'string' ? r : r?.itemName,
      )
      currentPart.benefitItems = currentPart.benefitItems.map((item: any) => {
        if (linkedNames.includes(item.itemName) && item.status === 'not_started') {
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

      const updatedLogoDeliverables = currentPart.deliverables.filter((d: any) =>
        d.itemName.toLowerCase().includes('logo'),
      )
      const isNowLogoCompleted =
        updatedLogoDeliverables.length === 0 ||
        updatedLogoDeliverables.every((d: any) => d.status === 'completed')

      setExpandedDeliverable(null)
      setActiveFormDeliverable(null)

      if (!isLogoCompleted && isNowLogoCompleted) {
        router.push('/dashboard')
        router.refresh()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error(error)
      alert('Hubo un error al guardar el entregable. Revise la consola.')
    } finally {
      setLoadingId(null)
    }
  }

  // Helper: renderiza una tarjeta de entregable (pendiente o completado)
  const renderDeliverableCard = (deliv: any, isUnlocked: boolean, key: string | number) => {
    const isPending = deliv.status === 'pending' || deliv.status === 'overdue'

    if (!isPending) {
      return (
        <div
          key={key}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-border/50 rounded-xl bg-background shadow-xs max-w-3xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <FileTextIcon className="w-5 h-5 text-emerald-600/70" />
            </div>
            <div>
              <p className="font-semibold text-[13.5px] text-zinc-900">{deliv.itemName}</p>
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
      )
    }

    return (
      <div
        key={key}
        className="flex flex-col border border-border/60 rounded-xl bg-background shadow-xs overflow-hidden transition-all max-w-3xl"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center shrink-0">
              {deliverableIcon(deliv.type)}
            </div>
            <div>
              <p className="font-semibold text-[13.5px] text-zinc-900">{deliv.itemName}</p>
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
                disabled={!isUnlocked}
                onClick={() =>
                  setExpandedDeliverable(expandedDeliverable === deliv.id ? null : deliv.id)
                }
              >
                {expandedDeliverable === deliv.id
                  ? 'Cancelar'
                  : deliv.type === 'action_link'
                    ? 'Ver Acción'
                    : !isUnlocked
                      ? 'Bloqueado'
                      : 'Enviar'}
              </Button>
            )}
          </div>
        </div>

        {expandedDeliverable === deliv.id && (
          <div className="p-4 bg-muted/10 border-t flex flex-col md:flex-row gap-3 items-end">
            <div className="w-full">
              {(deliv.type === 'document' || deliv.type === 'image') && (
                <Input
                  type="file"
                  className="bg-white"
                  disabled={!isUnlocked || loadingId === deliv.id}
                  onChange={(e) =>
                    setFileInputs({ ...fileInputs, [deliv.id]: e.target.files?.[0] || null })
                  }
                />
              )}
              {deliv.type === 'text' && (
                <Textarea
                  placeholder="Ingrese la información solicitada aquí..."
                  className="min-h-[80px] bg-white"
                  disabled={!isUnlocked || loadingId === deliv.id}
                  onChange={(e) => setTextInputs({ ...textInputs, [deliv.id]: e.target.value })}
                />
              )}
              {deliv.type === 'link' && (
                <Input
                  type="url"
                  placeholder="https://ejemplo.com"
                  className="bg-white"
                  disabled={!isUnlocked || loadingId === deliv.id}
                  onChange={(e) => setLinkInputs({ ...linkInputs, [deliv.id]: e.target.value })}
                />
              )}
              {deliv.type === 'action_link' && (
                <div className="flex flex-col gap-4 bg-white p-4 border border-border/80 rounded-md">
                  <p className="text-[13.5px] font-medium text-zinc-900">
                    Por favor, realiza la acción en el siguiente enlace:
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="w-fit"
                    onClick={() => setVisitedLinks({ ...visitedLinks, [deliv.id]: true })}
                  >
                    <a href={deliv.actionUrl} target="_blank" rel="noopener noreferrer">
                      Abrir Enlace{' '}
                      <ExternalLinkIcon className="w-4 h-4 ml-2 mt-0.5 text-muted-foreground" />
                    </a>
                  </Button>
                  {visitedLinks[deliv.id] && (
                    <div className="flex items-center space-x-3 bg-muted/30 p-3 rounded-md animate-in fade-in slide-in-from-top-1 mt-2">
                      <input
                        type="checkbox"
                        id={`check-${deliv.id}`}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary shadow-sm"
                        checked={!!textInputs[`checked-${deliv.id}`]}
                        onChange={(e) =>
                          setTextInputs({
                            ...textInputs,
                            [`checked-${deliv.id}`]: e.target.checked ? 'yes' : '',
                          })
                        }
                      />
                      <Label
                        htmlFor={`check-${deliv.id}`}
                        className="text-[13.5px] font-medium leading-none cursor-pointer"
                      >
                        Confirmo que ya completé la acción
                      </Label>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 mt-2 md:mt-0"
              disabled={
                loadingId === deliv.id ||
                (deliv.type === 'action_link' && !textInputs[`checked-${deliv.id}`])
              }
              onClick={() =>
                handleSubmitDeliverable(deliv.id, deliv.relatedItemNames || [], deliv.type)
              }
            >
              {loadingId === deliv.id ? (
                <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
              ) : deliv.type === 'action_link' ? (
                'Confirmar Acción'
              ) : (
                'Confirmar Envío'
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Utilidad de fecha reutilizable
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isDateUnlocked = (unlockDate: string | null | undefined) => {
    if (!unlockDate) return true
    return today >= new Date(unlockDate)
  }

  // --- ESTADÍSTICAS ---
  let totalDeliverablesCount = 0
  let completedDeliverablesCount = 0
  let pendingDeliverablesCount = 0
  let blockedDeliverablesCount = 0
  let localIsPreviousComplete = true

  orderedCategories.forEach((categoryName: string) => {
    const blockDeliverables = participationDeliverables.filter(
      (d: any) => d.benefitCategory === categoryName,
    )
    const blockItems = participationItems.filter(
      (item: any) => item.benefitCategory === categoryName,
    )

    const isBlockUnlocked = !isLogoCompleted
      ? blockDeliverables.some((d: any) => d.itemName.toLowerCase().includes('logo'))
      : localIsPreviousComplete

    const isCurrentBlockComplete =
      blockItems.length > 0 && blockItems.every((item: any) => item.status === 'completed')

    blockDeliverables.forEach((d: any) => {
      totalDeliverablesCount++
      if (d.status === 'completed') {
        completedDeliverablesCount++
      } else if (!isBlockUnlocked || !isDateUnlocked(d.unlockDate)) {
        blockedDeliverablesCount++
      } else {
        pendingDeliverablesCount++
      }
    })

    localIsPreviousComplete = isCurrentBlockComplete
  })

  const completedPercent =
    totalDeliverablesCount > 0
      ? Math.round((completedDeliverablesCount / totalDeliverablesCount) * 100)
      : 0

  let isPreviousBlockCompletedMap = true

  return (
    <>
      <div className="space-y-8 pb-10">
        {isLogoCompleted && (
          <>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Progreso y entregables
              </h1>
              <p className="text-muted-foreground mt-2 text-[15px]">
                Completa los requerimientos para desbloquear la ejecución de tus beneficios.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <Card className="shadow-sm border-border/80 rounded-[14px]">
                <CardContent className="p-5 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground/80 tracking-wide pb-1">
                    Total
                  </span>
                  <span className="text-3xl font-bold text-foreground">
                    {totalDeliverablesCount}
                  </span>
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
                  <span className="text-3xl font-bold text-foreground">
                    {pendingDeliverablesCount}
                  </span>
                  <span className="text-xs text-muted-foreground/90 font-medium">
                    Requieren acción
                  </span>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border/80 rounded-[14px]">
                <CardContent className="p-5 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground/80 tracking-wide pb-1">
                    Bloqueados
                  </span>
                  <span className="text-3xl font-bold text-foreground">
                    {blockedDeliverablesCount}
                  </span>
                  <span className="text-xs text-muted-foreground/90 font-medium">
                    Se desbloquean próximamente
                  </span>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!isLogoCompleted && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-6 py-4 rounded-xl flex items-start gap-4">
            <AlertCircleIcon className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Formatos de Logo Requeridos</h3>
              <p className="text-sm mt-1 opacity-90">
                Completa la entrega de los logos faltantes para desbloquear todos los beneficios de
                tu plan y acceder al dashboard completo. Todo lo demás se mantendrá bloqueado hasta
                completar esta acción.
              </p>
            </div>
          </div>
        )}

        <div className="ml-2 md:ml-4 border-l-[1.5px] border-muted-foreground/20 space-y-8 mt-10">
          {orderedCategories.map((categoryName: string, index: number) => {
            const blockDeliverables = participationDeliverables.filter(
              (d: any) => d.benefitCategory === categoryName,
            )
            const blockItems = participationItems.filter(
              (item: any) => item.benefitCategory === categoryName,
            )

            const isBlockUnlocked = !isLogoCompleted
              ? blockDeliverables.some((d: any) => d.itemName.toLowerCase().includes('logo'))
              : isPreviousBlockCompletedMap
            const isCurrentBlockCompleted =
              blockItems.length > 0 && blockItems.every((item: any) => item.status === 'completed')

            isPreviousBlockCompletedMap = isCurrentBlockCompleted

            // Entregables ligados a ítems vs. huérfanos (sin relatedItemNames)
            const linkedDeliverableIds = new Set(
              blockItems.flatMap((item: any) =>
                blockDeliverables
                  .filter((d: any) =>
                    d.relatedItemNames?.some((r: any) => r.itemName === item.itemName),
                  )
                  .map((d: any) => d.id),
              ),
            )
            const orphanDeliverables = blockDeliverables.filter(
              (d: any) => !linkedDeliverableIds.has(d.id),
            )

            return (
              <div key={index} className="relative pl-8 md:pl-12">
                {/* Indicador de estado en la línea de tiempo */}
                <div
                  className={`absolute -left-[14px] top-4 flex items-center justify-center w-7 h-7 rounded-full shrink-0 outline outline-4 outline-background
                  ${isCurrentBlockCompleted ? 'bg-primary text-primary-foreground' : isBlockUnlocked ? 'bg-white border border-muted-foreground/40 text-muted-foreground' : 'bg-transparent border-2 border-muted-foreground/20 text-muted-foreground/40'}`}
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
                  {/* HEADER DE CATEGORÍA */}
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

                  {/* CUERPO: entregables como bloque primario, ítems como sub-filas */}
                  <div className="p-5 lg:p-7 space-y-4">
                    {/* Entregable como card principal */}
                    {blockDeliverables.map((deliv: any, dIndex: number) => {
                      const sequentialUnlocked = isLogoCompleted
                        ? isBlockUnlocked
                        : deliv.itemName.toLowerCase().includes('logo')
                      const isDeliverableUnlocked =
                        sequentialUnlocked && isDateUnlocked(deliv.unlockDate)
                      const isPending = deliv.status === 'pending' || deliv.status === 'overdue'

                      // relatedItemNames puede ser string[] (nuevo) o [{itemName}][] (legacy)
                      const normalizeRelated = (arr: any[]): string[] =>
                        arr.map((r) => (typeof r === 'string' ? r : r?.itemName)).filter(Boolean)
                      const relatedNames = normalizeRelated(deliv.relatedItemNames || [])
                      const relatedItems = blockItems.filter((item: any) =>
                        relatedNames.includes(item.itemName),
                      )

                      return (
                        <div
                          key={deliv.id || dIndex}
                          className="border border-border/60 rounded-xl overflow-hidden bg-background shadow-xs"
                        >
                          {/* Fila principal del entregable */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center shrink-0">
                                {deliverableIcon(deliv.type)}
                              </div>
                              <div>
                                <p className="font-semibold text-[14px] text-zinc-900">
                                  {deliv.itemName}
                                </p>
                                <p className="text-[12px] text-muted-foreground mt-0.5">
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
                            <div className="flex items-center gap-2.5 w-full sm:w-auto mt-1 sm:mt-0 shrink-0">
                              {isPending ? (
                                <>
                                  <Badge
                                    variant="outline"
                                    className="text-amber-600 border-amber-300 bg-amber-50 h-7 px-3 text-xs font-medium"
                                  >
                                    Pendiente
                                  </Badge>
                                  {deliv.type !== 'direct' && (
                                    <Button
                                      className="bg-primary text-primary-foreground h-7 text-xs px-4"
                                      disabled={!isDeliverableUnlocked}
                                      onClick={() => {
                                        if (deliv.type === 'formulario') {
                                          setActiveFormDeliverable(deliv)
                                        } else {
                                          setExpandedDeliverable(
                                            expandedDeliverable === deliv.id ? null : deliv.id,
                                          )
                                        }
                                      }}
                                    >
                                      {deliv.type !== 'formulario' &&
                                      expandedDeliverable === deliv.id
                                        ? 'Cancelar'
                                        : !sequentialUnlocked
                                          ? 'Bloqueado'
                                          : !isDateUnlocked(deliv.unlockDate)
                                            ? `Disponible el ${new Date(deliv.unlockDate!).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                                            : deliv.type === 'action_link'
                                              ? 'Ver Acción'
                                              : deliv.type === 'formulario'
                                                ? 'Completar'
                                                : 'Enviar'}
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-emerald-700 border-emerald-300 bg-emerald-50 h-7 px-3 text-xs font-medium"
                                >
                                  <CheckCircle2Icon className="w-3 h-3 mr-1.5" /> Enviado
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Ítems del beneficio que desbloquea este entregable */}
                          {relatedItems.length > 0 && (
                            <div className="border-t border-border/50 bg-muted/5 px-4 py-3">
                              <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase mb-2.5">
                                Ítems que desbloquea
                              </p>
                              <div className="space-y-1.5">
                                {relatedItems.map((item: any, iIdx: number) => {
                                  const hasEvidences = item.evidences && item.evidences.length > 0
                                  return (
                                    <div
                                      key={item.id || iIdx}
                                      className="flex items-center justify-between gap-2 py-0.5"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        {item.status === 'completed' ? (
                                          <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                            <CheckCircle2Icon className="w-2 h-2 text-primary-foreground" />
                                          </div>
                                        ) : (
                                          <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                                        )}
                                        <span className="text-[13px] text-zinc-700 font-medium">
                                          {item.itemName}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {hasEvidences && (
                                          <button
                                            onClick={() => setEvidenceItem(item)}
                                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                          >
                                            <EyeIcon className="w-3 h-3 opacity-70" />
                                            Ver
                                          </button>
                                        )}
                                        {item.status === 'completed' && (
                                          <Badge variant="outline" className="text-[10px] h-5 px-2 text-emerald-700 border-emerald-200 bg-emerald-50 font-medium">
                                            Completado
                                          </Badge>
                                        )}
                                        {item.status === 'in_progress' && (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] h-5 px-2 text-amber-700 border-amber-200 bg-amber-50/50"
                                          >
                                            En progreso
                                          </Badge>
                                        )}
                                        {item.status === 'not_started' && (
                                          <span className="text-[10.5px] text-muted-foreground/50 font-medium">
                                            No iniciado
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Respuestas del formulario (completado) */}
                          {!isPending && deliv.type === 'formulario' && deliv.formResponse && (() => {
                            const form = typeof deliv.formId === 'object' ? deliv.formId : null
                            const response = deliv.formResponse as Record<string, any>
                            const entries = form?.fields
                              ? (form.fields as any[]).map((f: any) => ({
                                  label: f.label,
                                  key: f.fieldKey,
                                  type: f.type,
                                  value: response[f.fieldKey],
                                }))
                              : Object.entries(response).map(([k, v]) => ({
                                  label: k,
                                  key: k,
                                  type: 'text',
                                  value: v,
                                }))
                            if (!entries.length) return null
                            return (
                              <div className="border-t border-border/50 bg-muted/5 px-4 py-3">
                                <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase mb-3">
                                  Respuestas del formulario
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {entries.map((entry) => (
                                    <div key={entry.key} className="flex flex-col gap-0.5">
                                      <span className="text-[11px] text-muted-foreground font-medium">
                                        {entry.label}
                                      </span>
                                      {typeof entry.value === 'object' &&
                                      entry.value !== null &&
                                      entry.value?.url ? (
                                        <img
                                          src={entry.value.url}
                                          alt={entry.label}
                                          className="max-h-24 rounded border object-contain bg-muted/20 w-fit"
                                        />
                                      ) : entry.type === 'link' && entry.value ? (
                                        <a
                                          href={entry.value}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[13px] text-primary hover:underline flex items-center gap-1 break-all"
                                        >
                                          <LinkIcon className="w-3 h-3 shrink-0" />
                                          {entry.value}
                                        </a>
                                      ) : entry.type === 'email' && entry.value ? (
                                        <a
                                          href={`mailto:${entry.value}`}
                                          className="text-[13px] text-primary hover:underline"
                                        >
                                          {entry.value}
                                        </a>
                                      ) : entry.type === 'checkbox' ? (
                                        <span className="text-[13px] text-zinc-700 font-medium">
                                          {entry.value ? 'Sí' : 'No'}
                                        </span>
                                      ) : (
                                        <span className="text-[13px] text-zinc-700 font-medium">
                                          {entry.value != null && typeof entry.value !== 'object'
                                            ? String(entry.value)
                                            : '—'}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}

                          {/* Entrega inline (todo excepto formulario, que usa modal) */}
                          {expandedDeliverable === deliv.id &&
                            isPending &&
                            deliv.type !== 'formulario' && (
                              <div className="p-4 bg-muted/10 border-t border-border/50 flex flex-col gap-4">
                                <div className="w-full">
                                  {(deliv.type === 'document' || deliv.type === 'image') && (
                                    <Input
                                      type="file"
                                      className="bg-white"
                                      disabled={!isDeliverableUnlocked || loadingId === deliv.id}
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
                                      disabled={!isDeliverableUnlocked || loadingId === deliv.id}
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
                                      disabled={!isDeliverableUnlocked || loadingId === deliv.id}
                                      onChange={(e) =>
                                        setLinkInputs({
                                          ...linkInputs,
                                          [deliv.id]: e.target.value,
                                        })
                                      }
                                    />
                                  )}
                                  {deliv.type === 'action_link' && (
                                    <div className="flex flex-col gap-4 bg-white p-4 border border-border/80 rounded-md">
                                      <p className="text-[13.5px] font-medium text-zinc-900">
                                        Por favor, realiza la acción en el siguiente enlace:
                                      </p>
                                      <Button
                                        asChild
                                        variant="outline"
                                        className="w-fit"
                                        onClick={() =>
                                          setVisitedLinks({ ...visitedLinks, [deliv.id]: true })
                                        }
                                      >
                                        <a
                                          href={deliv.actionUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          Abrir Enlace{' '}
                                          <ExternalLinkIcon className="w-4 h-4 ml-2 mt-0.5 text-muted-foreground" />
                                        </a>
                                      </Button>
                                      {visitedLinks[deliv.id] && (
                                        <div className="flex items-center space-x-3 bg-muted/30 p-3 rounded-md animate-in fade-in slide-in-from-top-1 mt-2">
                                          <input
                                            type="checkbox"
                                            id={`check-${deliv.id}`}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary shadow-sm"
                                            checked={!!textInputs[`checked-${deliv.id}`]}
                                            onChange={(e) =>
                                              setTextInputs({
                                                ...textInputs,
                                                [`checked-${deliv.id}`]: e.target.checked
                                                  ? 'yes'
                                                  : '',
                                              })
                                            }
                                          />
                                          <Label
                                            htmlFor={`check-${deliv.id}`}
                                            className="text-[13.5px] font-medium leading-none cursor-pointer"
                                          >
                                            Confirmo que ya completé la acción
                                          </Label>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  className="w-full md:w-auto self-end bg-primary text-primary-foreground hover:bg-primary/90"
                                  disabled={
                                    loadingId === deliv.id ||
                                    (deliv.type === 'action_link' &&
                                      !textInputs[`checked-${deliv.id}`])
                                  }
                                  onClick={() =>
                                    handleSubmitDeliverable(
                                      deliv.id,
                                      deliv.relatedItemNames || [],
                                      deliv.type,
                                    )
                                  }
                                >
                                  {loadingId === deliv.id ? (
                                    <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                                  ) : deliv.type === 'action_link' ? (
                                    'Confirmar Acción'
                                  ) : (
                                    'Confirmar Envío'
                                  )}
                                </Button>
                              </div>
                            )}
                        </div>
                      )
                    })}

                    {/* Ítems huérfanos: sin entregable asociado */}
                    {(() => {
                      const linkedItemNames = new Set(
                        blockDeliverables.flatMap((d: any) =>
                          (d.relatedItemNames || []).map((r: any) => r.itemName),
                        ),
                      )
                      const orphanItems = blockItems.filter(
                        (item: any) => !linkedItemNames.has(item.itemName),
                      )
                      if (!orphanItems.length) return null
                      return (
                        <div className="border border-border/60 rounded-xl overflow-hidden bg-background shadow-xs">
                          <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
                            <p className="text-[11px] font-bold tracking-widest text-muted-foreground/70 uppercase">
                              Ítems del beneficio
                            </p>
                          </div>
                          <div className="px-4 py-3 space-y-1.5">
                            {orphanItems.map((item: any, idx: number) => {
                              const hasEvidences = item.evidences && item.evidences.length > 0
                              return (
                                <div
                                  key={item.id || idx}
                                  className="flex items-center justify-between gap-2 py-1"
                                >
                                  <div className="flex items-center gap-2.5">
                                    {item.status === 'completed' ? (
                                      <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                        <CheckCircle2Icon className="w-2 h-2 text-primary-foreground" />
                                      </div>
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                                    )}
                                    <span className="text-[13px] text-zinc-700 font-medium">
                                      {item.itemName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {hasEvidences && (
                                      <button
                                        onClick={() => setEvidenceItem(item)}
                                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                      >
                                        <EyeIcon className="w-3 h-3 opacity-70" /> Ver
                                      </button>
                                    )}
                                    {item.status === 'completed' && (
                                      <Badge className="text-[10px] h-5 px-2 bg-primary/10 text-primary border-0 font-medium hover:bg-primary/10">
                                        Completado
                                      </Badge>
                                    )}
                                    {item.status === 'in_progress' && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-5 px-2 text-amber-700 border-amber-200 bg-amber-50/50"
                                      >
                                        En progreso
                                      </Badge>
                                    )}
                                    {item.status === 'not_started' && (
                                      <span className="text-[10.5px] text-muted-foreground/50 font-medium">
                                        No iniciado
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Estado vacío */}
                    {blockItems.length === 0 && blockDeliverables.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4 italic">
                        Sin contenido configurado en esta categoría.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL FORMULARIO */}
      <Dialog
        open={!!activeFormDeliverable}
        onOpenChange={(open) => !open && setActiveFormDeliverable(null)}
      >
        {activeFormDeliverable &&
          (() => {
            const deliv = activeFormDeliverable
            const form = typeof deliv.formId === 'object' ? deliv.formId : null
            const isLoading = loadingId === deliv.id

            const isInvalid = ((form?.fields as any[]) || []).some((f: any) => {
              if (!f.required) return false
              if (f.type === 'checkbox') return false
              if (f.type === 'image') return !formFileInputs[deliv.id]?.[f.fieldKey]
              return !formInputs[deliv.id]?.[f.fieldKey]
            })

            const renderField = (field: any) => {
              const did = deliv.id
              const val = formInputs[did]?.[field.fieldKey] ?? ''
              const setVal = (v: any) =>
                setFormInputs((prev) => ({
                  ...prev,
                  [did]: { ...prev[did], [field.fieldKey]: v },
                }))

              return (
                <div key={field.id || field.fieldKey} className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-zinc-700">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === 'text' && (
                    <Input
                      placeholder={field.placeholder || ''}
                      className="bg-white"
                      disabled={isLoading}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                    />
                  )}
                  {field.type === 'textarea' && (
                    <Textarea
                      placeholder={field.placeholder || ''}
                      className="min-h-[90px] bg-white"
                      disabled={isLoading}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                    />
                  )}
                  {field.type === 'number' && (
                    <Input
                      type="number"
                      placeholder={field.placeholder || ''}
                      className="bg-white"
                      disabled={isLoading}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                    />
                  )}
                  {field.type === 'date' && (
                    <Input
                      type="date"
                      className="bg-white"
                      disabled={isLoading}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      className="w-full h-9 px-3 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      disabled={isLoading}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                    >
                      <option value="">Selecciona una opción...</option>
                      {(field.options || []).map((opt: any) => (
                        <option key={opt.optionValue} value={opt.optionValue}>
                          {opt.optionLabel}
                        </option>
                      ))}
                    </select>
                  )}
                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <input
                        type="checkbox"
                        id={`mf-${did}-${field.fieldKey}`}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        disabled={isLoading}
                        checked={!!formInputs[did]?.[field.fieldKey]}
                        onChange={(e) => setVal(e.target.checked)}
                      />
                      <Label
                        htmlFor={`mf-${did}-${field.fieldKey}`}
                        className="text-[13px] cursor-pointer font-normal"
                      >
                        {field.placeholder || field.label}
                      </Label>
                    </div>
                  )}
                  {field.type === 'image' && (
                    <Input
                      type="file"
                      accept="image/*"
                      className="bg-white"
                      disabled={isLoading}
                      onChange={(e) =>
                        setFormFileInputs((prev) => ({
                          ...prev,
                          [did]: { ...prev[did], [field.fieldKey]: e.target.files?.[0] || null },
                        }))
                      }
                    />
                  )}
                  {field.type === 'link' && (
                    <Input
                      type="url"
                      placeholder={field.placeholder || 'https://ejemplo.com'}
                      className="bg-white"
                      disabled={isLoading}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                    />
                  )}
                  {field.type === 'email' && (
                    <Input
                      type="email"
                      placeholder={field.placeholder || 'correo@ejemplo.com'}
                      className="bg-white"
                      disabled={isLoading}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                    />
                  )}
                </div>
              )
            }

            return (
              <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">{deliv.itemName}</DialogTitle>
                  {form?.description && (
                    <DialogDescription className="text-[13.5px]">
                      {form.description}
                    </DialogDescription>
                  )}
                </DialogHeader>

                {!form?.fields?.length ? (
                  <p className="text-sm text-muted-foreground py-6 text-center italic">
                    No hay campos configurados en este formulario.
                  </p>
                ) : (
                  <div className="space-y-5 py-2">{(form.fields as any[]).map(renderField)}</div>
                )}

                <DialogFooter className="mt-2 gap-2 flex-row justify-end">
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => setActiveFormDeliverable(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground"
                    disabled={isLoading || isInvalid}
                    onClick={() =>
                      handleSubmitDeliverable(deliv.id, deliv.relatedItemNames || [], deliv.type)
                    }
                  >
                    {isLoading && <Loader2Icon className="w-4 h-4 animate-spin mr-2" />}
                    Enviar Formulario
                  </Button>
                </DialogFooter>
              </DialogContent>
            )
          })()}
      </Dialog>

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
