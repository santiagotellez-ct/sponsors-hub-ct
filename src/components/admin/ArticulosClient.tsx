'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import Cropper from 'react-easy-crop'
import { compressImageForUpload } from '@/lib/compress-image-for-upload'

const TIER_COLORS: Record<string, string> = {
  Diamond: '#b9f2ff',
  Platinum: '#e5e4e2',
  Gold: '#ffd700',
  Silver: '#c0c0c0',
  Bronze: '#cd7f32',
  Aliados: '#e2e8f0',
  Experiencia: '#e2e8f0',
  Presenta: '#e2e8f0',
  'Media Partner': '#e2e8f0',
}

type ArticleStatus = 'none' | 'draft' | 'published'

const STATUS_CFG: Record<ArticleStatus, { label: string; bg: string; color: string; dot: string }> = {
  none: { label: 'Sin artículo', bg: 'var(--theme-elevation-100)', color: 'var(--theme-elevation-500)', dot: 'var(--theme-elevation-300)' },
  draft: { label: 'Borrador', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  published: { label: 'Publicado', bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
}

function toId(val: any) {
  return val && typeof val === 'object' ? val.id : val
}

function initials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

type CroppedAreaPixels = { x: number; y: number; width: number; height: number }

// Draws the crop rectangle (in the source image's own pixel coordinates,
// as returned by react-easy-crop's onCropComplete) onto an offscreen
// canvas and reads it back out as the actual cropped image — no CSS
// transform approximation involved.
async function cropImageToCanvas(
  imageSrc: string,
  area: CroppedAreaPixels,
): Promise<{ dataUrl: string; blob: Blob }> {
  const img = await loadImageElement(imageSrc)
  const cropWidth = Math.max(1, Math.round(area.width))
  const cropHeight = Math.max(1, Math.round(area.height))
  const maxWidth = 1080
  const maxHeight = 1350
  const scale = Math.min(1, maxWidth / cropWidth, maxHeight / cropHeight)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(cropWidth * scale))
  canvas.height = Math.max(1, Math.round(cropHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen recortada'))),
      'image/jpeg',
      0.92,
    )
  })
  return { dataUrl, blob }
}

// Minimal Lexical doc <-> plain text round-trip. Good enough for a plain
// textarea editing a richText field; Fase 4 will swap this for the real
// Lexical editor and this helper pair goes away.
function lexicalFromPlainText(text: string) {
  const paragraphs = (text || '').split(/\n+/)
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: paragraphs.map(p => ({
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [
          {
            type: 'text',
            version: 1,
            text: p,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
      })),
    },
  }
}

function lexicalToPlainText(value: any): string {
  const children = value?.root?.children
  if (!Array.isArray(children)) return ''
  return children
    .map((node: any) => (Array.isArray(node?.children) ? node.children.map((c: any) => c?.text ?? '').join('') : ''))
    .join('\n')
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--theme-elevation-500)',
  marginBottom: '4px',
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: '6px',
  color: 'var(--theme-text)',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  outline: 'none',
  resize: 'vertical' as const,
}

const buttonPrimary: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'var(--theme-text)',
  color: 'var(--theme-bg)',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const buttonSecondary: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'transparent',
  color: 'var(--theme-text)',
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: '6px',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

function toggleButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.35rem 0.875rem',
    borderRadius: '6px',
    border: `1px solid ${active ? 'var(--theme-text)' : 'var(--theme-elevation-200)'}`,
    background: active ? 'var(--theme-text)' : 'transparent',
    color: active ? 'var(--theme-bg)' : 'var(--theme-text)',
    fontSize: '0.8125rem',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

const CTF_LOGO_BLANCO = 'https://www.figma.com/api/mcp/asset/6e8ec906-e2c3-4df4-bab9-4da8acf69f93'
const CTF_LOGO_NEGRO = '/Logo-CTF-NegroAmarillo.png'

const CATEGORIA_OPTIONS = [
  'IA & Automatización',
  'Fintech & Pagos',
  'Future of Work',
  'Movilidad & Logística',
  'SaaS & Software',
  'Talento & Educación',
  'Ventas & Marketing',
  'Startups & Venture',
  'Ciberseguridad',
  'E-commerce & Retail',
]

const TIER_FILTER_OPTIONS = Object.keys(TIER_COLORS)
const NO_TIER_VALUE = '__none__'

// Pill-style chip, matching the Todos/Con pendientes/100% completos
// filter buttons in CSDashboardClient.tsx.
function chipButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.35rem 0.875rem',
    borderRadius: '99px',
    border: `1px solid ${active ? 'var(--theme-text)' : 'var(--theme-elevation-200)'}`,
    background: active ? 'var(--theme-text)' : 'transparent',
    color: active ? 'var(--theme-bg)' : 'var(--theme-text)',
    fontSize: '0.8125rem',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

type ArticuloFilter = 'all' | 'con' | 'sin' | 'publicado'
type LogoBlancoFilter = 'all' | 'con' | 'sin'

// Full-screen crop modal, opened right after a new source image is picked.
function CropModal({
  image,
  crop,
  zoom,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onConfirm,
  onCancel,
  confirming,
}: {
  image: string
  crop: { x: number; y: number }
  zoom: number
  onCropChange: (crop: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  onCropComplete: (croppedArea: any, croppedAreaPixels: CroppedAreaPixels) => void
  onConfirm: () => void
  onCancel: () => void
  confirming: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
      }}
    >
      <div style={{ position: 'relative', width: '540px', maxWidth: '90vw', height: '675px', maxHeight: '65vh', background: '#111', borderRadius: '4px', overflow: 'hidden' }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1080 / 1350}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropComplete}
        />
      </div>
      <input
        type="range"
        min={1}
        max={3}
        step={0.01}
        value={zoom}
        onChange={e => onZoomChange(Number(e.target.value))}
        style={{ width: '540px', maxWidth: '90vw' }}
      />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="button" onClick={onCancel} disabled={confirming} style={{ ...buttonSecondary, background: 'var(--theme-bg)', opacity: confirming ? 0.6 : 1 }}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={confirming} style={{ ...buttonPrimary, opacity: confirming ? 0.6 : 1 }}>
          {confirming ? 'Procesando…' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}

function ArticuloEditor({
  sponsor,
  onBack,
  onSaved,
}: {
  sponsor: any
  onBack: () => void
  onSaved: (sponsorId: string | number, status: 'draft' | 'published', categoria?: string | null) => void
}) {
  const [loadingArticle, setLoadingArticle] = useState(true)
  const [articleId, setArticleId] = useState<string | number | null>(null)
  const [eventId, setEventId] = useState<string | number | null>(null)
  const [datoImpactante, setDatoImpactante] = useState('')
  const [articuloCorto, setArticuloCorto] = useState('')
  const [categoriaState, setCategoriaState] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [slug, setSlug] = useState('')
  const [publishedAt, setPublishedAt] = useState<string | null>(null)

  const [imagenId, setImagenId] = useState<string | number | null>(null)
  const [imageSourceId, setImageSourceId] = useState<string | number | null>(null)
  const [imageSourceUrl, setImageSourceUrl] = useState<string | null>(null) // existing media, from server
  const [imageSourceFile, setImageSourceFile] = useState<File | null>(null) // actual cropped result, pending upload
  const [imageSourcePreview, setImageSourcePreview] = useState<string | null>(null) // actual cropped result, as a data URL

  const [rawImageDataUrl, setRawImageDataUrl] = useState<string | null>(null) // uncropped pick, only while the crop modal is open
  const [imageCrop, setImageCrop] = useState({ x: 0, y: 0, zoom: 1 }) // pan/zoom for the crop modal only — not used for rendering
  const croppedAreaPixelsRef = useRef<CroppedAreaPixels | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropping, setCropping] = useState(false)
  const preConfirmState = useRef<{ file: File | null; preview: string | null } | null>(null)

  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Logo variants: preview/export only, never persisted.
  const [logoVariant, setLogoVariant] = useState<'blanco' | 'color'>('blanco')
  const [ctfLogoVariant, setCtfLogoVariant] = useState<'blanco' | 'negro'>('blanco')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const previewWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingArticle(true)
    fetch(`/api/sponsor-articles?where[sponsor][equals]=${sponsor.id}&limit=1&depth=1`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const doc = data.docs?.[0]
        if (doc) {
          setArticleId(doc.id)
          setEventId(toId(doc.event))
          setDatoImpactante(doc.datoImpactante || '')
          setArticuloCorto(lexicalToPlainText(doc.articuloCorto))
          setCategoriaState(doc.categoria || '')
          setStatus(doc.status === 'published' ? 'published' : 'draft')
          setSlug(doc.slug || '')
          setPublishedAt(doc.publishedAt || null)
          setImagenId(toId(doc.imagen))
          setImageSourceId(toId(doc.imageSource))
          setImageSourceUrl(doc.imageSource && typeof doc.imageSource === 'object' ? doc.imageSource.url : null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingArticle(false)
      })
    return () => {
      cancelled = true
    }
  }, [sponsor.id])

  const previewImageUrl = imageSourcePreview || imageSourceUrl

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const dataUrl = await readFileAsDataURL(file)
    preConfirmState.current = { file: imageSourceFile, preview: imageSourcePreview }
    setRawImageDataUrl(dataUrl)
    setImageCrop({ x: 0, y: 0, zoom: 1 })
    croppedAreaPixelsRef.current = null
    setCropModalOpen(true)
  }

  const handleCropCancel = () => {
    if (preConfirmState.current) {
      setImageSourceFile(preConfirmState.current.file)
      setImageSourcePreview(preConfirmState.current.preview)
    }
    setRawImageDataUrl(null)
    setCropModalOpen(false)
  }

  const handleCropConfirm = async () => {
    const area = croppedAreaPixelsRef.current
    if (!rawImageDataUrl || !area) {
      setCropModalOpen(false)
      setRawImageDataUrl(null)
      return
    }
    setCropping(true)
    try {
      const { dataUrl, blob } = await cropImageToCanvas(rawImageDataUrl, area)
      const croppedFile = new File([blob], 'sponsor-photo-cropped.jpg', { type: 'image/jpeg' })
      setImageSourcePreview(dataUrl)
      setImageSourceFile(croppedFile)
      setRawImageDataUrl(null)
      setCropModalOpen(false)
    } catch (err) {
      console.error('Error recortando la imagen', err)
      window.alert('Error al procesar el recorte, intenta de nuevo')
    } finally {
      setCropping(false)
    }
  }

  async function captureFullResPng(): Promise<Blob | null> {
    const node = previewRef.current
    const wrapper = previewWrapperRef.current
    if (!node) return null

    const prevTransform = node.style.transform
    const prevOrigin = node.style.transformOrigin
    const prevWrapperWidth = wrapper?.style.width
    const prevWrapperHeight = wrapper?.style.height

    try {
      node.style.transform = 'scale(2)'
      node.style.transformOrigin = 'top left'
      if (wrapper) {
        wrapper.style.width = '1080px'
        wrapper.style.height = '1350px'
      }
      // let the transform apply before capturing
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const blob = await toBlob(node, { width: 1080, height: 1350, pixelRatio: 1 })
      return blob
    } finally {
      node.style.transform = prevTransform
      node.style.transformOrigin = prevOrigin
      if (wrapper) {
        wrapper.style.width = prevWrapperWidth || ''
        wrapper.style.height = prevWrapperHeight || ''
      }
    }
  }

  const handleExportPng = async () => {
    if (!previewImageUrl) {
      window.alert('Agrega una imagen antes de exportar')
      return
    }
    setExporting(true)
    try {
      const blob = await captureFullResPng()
      if (!blob) throw new Error('No se pudo generar la imagen')
      const filename = `${slug || slugify(sponsor.companyName) || 'sponsor'}-1080x1350.png`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando PNG', err)
      window.alert('Error al exportar la imagen')
    } finally {
      setExporting(false)
    }
  }

  const toAbsoluteUrl = (path: string | null | undefined): string | null => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${window.location.origin}${path}`
  }

  async function uploadMedia(file: File | Blob, filename: string): Promise<string | number> {
    const compressed = await compressImageForUpload(file, filename, {
      maxWidth: 1080,
      maxHeight: 1350,
    })
    const formData = new FormData()
    formData.append('file', compressed)
    const res = await fetch('/api/media', { method: 'POST', credentials: 'include', body: formData })
    if (res.status === 413) {
      throw new Error(
        'La imagen es demasiado grande para el servidor (máx. ~4 MB). Usa una foto de menor resolución.',
      )
    }
    if (!res.ok) throw new Error('Error subiendo el archivo')
    const data = await res.json()
    return data.doc.id
  }

  const handleSave = async (targetStatus: 'draft' | 'published') => {
    setSaving(targetStatus)
    setSaveMessage(null)
    try {
      let finalImageSourceId = imageSourceId
      if (imageSourceFile) {
        finalImageSourceId = await uploadMedia(imageSourceFile, imageSourceFile.name)
      }

      // The exported PNG is the final artifact for this article, so we
      // (re)generate and upload it as `imagen` on every save when there's
      // a source image, rather than requiring a separate manual export step.
      let finalImagenId = imagenId
      if (previewImageUrl) {
        const blob = await captureFullResPng()
        if (blob) {
          const filename = `${slug || slugify(sponsor.companyName) || 'sponsor'}-1080x1350.png`
          finalImagenId = await uploadMedia(blob, filename.replace(/\.png$/i, '.jpg'))
        }
      }

      const finalSlug = targetStatus === 'published' && !slug ? slugify(sponsor.companyName) : slug
      const finalPublishedAt = targetStatus === 'published' ? publishedAt || new Date().toISOString() : publishedAt

      const body: Record<string, any> = {
        sponsor: sponsor.id,
        event: eventId || null,
        datoImpactante,
        articuloCorto: articuloCorto.trim() ? lexicalFromPlainText(articuloCorto) : null,
        imagen: finalImagenId ?? null,
        imageSource: finalImageSourceId ?? null,
        status: targetStatus,
        publishedAt: finalPublishedAt,
        companyName: sponsor.companyName || null,
        logoUrl: toAbsoluteUrl(sponsor.logoBlanco?.url || sponsor.logo?.url || null),
        tier: sponsor.tier || null,
        articuloTexto: articuloCorto || null,
        categoria: categoriaState || null,
        categoriaText: categoriaState || null,
      }
      if (finalSlug) body.slug = finalSlug

      const res = await fetch(articleId ? `/api/sponsor-articles/${articleId}` : '/api/sponsor-articles', {
        method: articleId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.errors?.[0]?.message || 'Error al guardar el artículo')
      }
      const data = await res.json()
      const savedDoc = data.doc ?? data

      // The exported PNG's public URL isn't known until after the media doc is
      // saved and linked, so a second round-trip fetches it back before we can
      // denormalize it onto the published article for anon reads.
      if (targetStatus === 'published') {
        const fetchRes = await fetch(`/api/sponsor-articles/${savedDoc.id}?depth=1`, { credentials: 'include' })
        if (fetchRes.ok) {
          const fetchedDoc = await fetchRes.json()
          const finalImagenUrl =
            fetchedDoc?.imagen && typeof fetchedDoc.imagen === 'object' ? fetchedDoc.imagen.url : null
          if (finalImagenUrl) {
            await fetch(`/api/sponsor-articles/${savedDoc.id}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imagenUrl: toAbsoluteUrl(finalImagenUrl) }),
            })
          }
        }
      }

      setArticleId(savedDoc.id)
      setStatus(targetStatus)
      setSlug(finalSlug)
      setPublishedAt(finalPublishedAt)
      setImagenId(finalImagenId ?? null)
      setImageSourceId(finalImageSourceId ?? null)
      setImageSourceFile(null)
      setSaveMessage({ type: 'success', text: targetStatus === 'published' ? 'Artículo publicado.' : 'Borrador guardado.' })
      onSaved(sponsor.id, targetStatus, categoriaState || null)
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err?.message || 'Error al guardar el artículo' })
    } finally {
      setSaving(null)
    }
  }

  const tierColor = sponsor.tier ? TIER_COLORS[sponsor.tier] : null
  const hasLogoBlanco = Boolean(sponsor.logoBlanco?.url)
  const sponsorLogoUrl = hasLogoBlanco
    ? (logoVariant === 'blanco' ? sponsor.logoBlanco.url : sponsor.logo?.url || sponsor.logoBlanco.url)
    : sponsor.logo?.url || null
  const ctfLogoUrl = ctfLogoVariant === 'blanco' ? CTF_LOGO_BLANCO : CTF_LOGO_NEGRO

  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      {cropModalOpen && rawImageDataUrl && (
        <CropModal
          image={rawImageDataUrl}
          crop={{ x: imageCrop.x, y: imageCrop.y }}
          zoom={imageCrop.zoom}
          onCropChange={c => setImageCrop(prev => ({ ...prev, x: c.x, y: c.y }))}
          onZoomChange={z => setImageCrop(prev => ({ ...prev, zoom: z }))}
          onCropComplete={(_area, areaPixels) => {
            croppedAreaPixelsRef.current = areaPixels
          }}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          confirming={cropping}
        />
      )}

      {/* Left panel — live preview */}
      <div
        style={{
          flex: '0 0 auto',
          padding: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'var(--theme-elevation-50)',
          borderRight: '1px solid var(--theme-elevation-150)',
          overflow: 'auto',
        }}
      >
        <div ref={previewWrapperRef} style={{ width: '540px', height: '675px' }}>
          <div
            ref={previewRef}
            data-preview-node
            style={{
              position: 'relative',
              width: '540px',
              height: '675px',
              overflow: 'hidden',
              background: '#1f2937',
              borderRadius: '4px',
            }}
          >
            {/* 1. Background image layer */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt=""
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                  }}
                >
                  Sin imagen
                </div>
              )}
            </div>

            {/* 2. Gradient overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '531px',
                background: 'linear-gradient(180deg, rgba(19,18,18,0) 0%, #131212 70.67%)',
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
              }}
            />

            {/* 4. Logos row (drawn before the quote so the quote sits on top when both overlap) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                padding: '50px 32px 0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              {sponsorLogoUrl ? (
                <img
                  src={sponsorLogoUrl}
                  alt={sponsor.companyName || ''}
                  style={{ height: '38.67px', width: '104.5px', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ height: '38.67px', width: '104.5px' }} />
              )}
              <img
                src={ctfLogoUrl}
                alt="Colombia Tech Fest"
                style={{ height: '31.25px', width: '104.5px', objectFit: 'contain' }}
              />
            </div>

            {/* 3. Quote text block */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                padding: '0 32px 50px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '29.96px',
                color: '#f3f4f6',
                lineHeight: 'normal',
                wordBreak: 'break-word',
              }}
            >
              {datoImpactante}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — controls */}
      <div style={{ flex: '1 1 auto', padding: '1.75rem 2rem', overflowY: 'auto' }}>
        <button type="button" onClick={onBack} style={{ ...buttonSecondary, marginBottom: '1.5rem' }}>
          ← Volver
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>
            {sponsor.companyName || 'Sin nombre'}
          </h2>
          {tierColor && (
            <span
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.7rem',
                borderRadius: '99px',
                fontSize: '0.6875rem',
                fontWeight: 700,
                background: tierColor,
                color: '#1f2937',
              }}
            >
              {sponsor.tier}
            </span>
          )}
        </div>

        {loadingArticle ? (
          <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem' }}>Cargando artículo…</p>
        ) : (
          <>
            <div style={{ marginBottom: '1.25rem' }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              <button type="button" onClick={() => fileInputRef.current?.click()} style={buttonSecondary}>
                {previewImageUrl ? 'Cambiar imagen' : 'Agregar imagen'}
              </button>
            </div>

            {hasLogoBlanco && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Logo del sponsor</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setLogoVariant('blanco')} style={toggleButtonStyle(logoVariant === 'blanco')}>
                    Blanco
                  </button>
                  <button type="button" onClick={() => setLogoVariant('color')} style={toggleButtonStyle(logoVariant === 'color')}>
                    Color
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Logo Colombia Tech Fest</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setCtfLogoVariant('blanco')} style={toggleButtonStyle(ctfLogoVariant === 'blanco')}>
                  Blanco
                </button>
                <button type="button" onClick={() => setCtfLogoVariant('negro')} style={toggleButtonStyle(ctfLogoVariant === 'negro')}>
                  Negro
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Dato impactante</label>
              <textarea
                value={datoImpactante}
                maxLength={200}
                rows={3}
                onChange={e => setDatoImpactante(e.target.value)}
                style={fieldStyle}
                placeholder="La cita que se muestra sobre la imagen…"
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--theme-elevation-400)' }}>
                {datoImpactante.length}/200
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Artículo corto</label>
              <textarea
                value={articuloCorto}
                rows={8}
                onChange={e => setArticuloCorto(e.target.value)}
                style={fieldStyle}
                placeholder="Copy del onepager, no se muestra sobre la imagen…"
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Categoría temática</label>
              <select
                value={categoriaState}
                onChange={e => setCategoriaState(e.target.value)}
                style={fieldStyle}
              >
                <option value="">Sin categoría</option>
                {CATEGORIA_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button type="button" onClick={handleExportPng} disabled={exporting} style={{ ...buttonSecondary, opacity: exporting ? 0.6 : 1 }}>
                {exporting ? 'Exportando…' : 'Exportar PNG'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--theme-elevation-150)' }}>
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={saving !== null}
                style={{ ...buttonSecondary, opacity: saving !== null ? 0.6 : 1 }}
              >
                {saving === 'draft' ? 'Guardando…' : 'Guardar borrador'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={saving !== null}
                style={{ ...buttonPrimary, opacity: saving !== null ? 0.6 : 1 }}
              >
                {saving === 'published' ? 'Publicando…' : 'Publicar'}
              </button>
            </div>

            {saveMessage && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: saveMessage.type === 'error' ? '#991b1b' : '#065f46' }}>
                {saveMessage.text}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SponsorCard({
  sponsor,
  status,
  onClick,
}: {
  sponsor: any
  status: ArticleStatus
  onClick: () => void
}) {
  const logoUrl = sponsor.logo && typeof sponsor.logo === 'object' ? sponsor.logo.url : null
  const tierColor = sponsor.tier ? TIER_COLORS[sponsor.tier] : null
  const cfg = STATUS_CFG[status]

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1.25rem 1rem',
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '10px',
        cursor: 'pointer',
        textAlign: 'center',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-elevation-300)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-elevation-150)'
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={sponsor.companyName || ''}
          style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px', background: 'var(--theme-bg)' }}
        />
      ) : (
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '8px',
            background: 'var(--theme-elevation-150)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--theme-elevation-500)',
          }}
        >
          {initials(sponsor.companyName)}
        </div>
      )}

      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--theme-text)', lineHeight: 1.3 }}>
        {sponsor.companyName || 'Sin nombre'}
      </span>

      {tierColor && (
        <span
          style={{
            display: 'inline-block',
            padding: '0.2rem 0.7rem',
            borderRadius: '99px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            background: tierColor,
            color: '#1f2937',
          }}
        >
          {sponsor.tier}
        </span>
      )}

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '0.2rem 0.7rem',
          borderRadius: '99px',
          background: cfg.bg,
          color: cfg.color,
          fontSize: '0.6875rem',
          fontWeight: 600,
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot }} />
        {cfg.label}
      </span>
    </button>
  )
}

// Diagnostic: catches render-time errors that would otherwise produce a
// blank admin view with nothing but a console stack trace from React's
// dev overlay (which isn't visible in production).
class ArticulosErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ArticulosClient render error', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: '#991b1b' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem' }}>Ocurrió un error al cargar Artículos</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8125rem', color: 'var(--theme-text)' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

export const ArticulosClient: React.FC = () => {
  console.error('ArticulosClient mounting')
  return (
    <ArticulosErrorBoundary>
      <ArticulosClientInner />
    </ArticulosErrorBoundary>
  )
}

function ArticulosClientInner() {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | number | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<{
    tiers: string[]
    logoBlanco: LogoBlancoFilter
    articulo: ArticuloFilter
  }>({ tiers: [], logoBlanco: 'all', articulo: 'all' })

  useEffect(() => {
    Promise.all([
      fetch('/api/sponsors?limit=300&depth=1', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/sponsor-articles?limit=300&depth=1', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([sponsorsData, articlesData]) => {
        setSponsors(sponsorsData.docs || [])
        setArticles(articlesData.docs || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const articleBySponsor = useMemo(() => {
    const map = new Map<string, any>()
    for (const a of articles) {
      const sId = toId(a.sponsor)
      if (sId != null) map.set(String(sId), a)
    }
    return map
  }, [articles])

  const selectedSponsor = useMemo(
    () => sponsors.find(s => String(s.id) === String(selectedSponsorId)) ?? null,
    [sponsors, selectedSponsorId],
  )

  const filteredSponsors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return sponsors.filter(sponsor => {
      if (q && !sponsor.companyName?.toLowerCase().includes(q)) return false

      if (activeFilters.tiers.length > 0) {
        const tierValue = sponsor.tier || NO_TIER_VALUE
        if (!activeFilters.tiers.includes(tierValue)) return false
      }

      if (activeFilters.logoBlanco === 'con' && !sponsor.logoBlanco?.url) return false
      if (activeFilters.logoBlanco === 'sin' && sponsor.logoBlanco?.url) return false

      if (activeFilters.articulo !== 'all') {
        const article = articleBySponsor.get(String(sponsor.id))
        const status: ArticleStatus = article ? (article.status === 'published' ? 'published' : 'draft') : 'none'
        if (activeFilters.articulo === 'con' && status === 'none') return false
        if (activeFilters.articulo === 'sin' && status !== 'none') return false
        if (activeFilters.articulo === 'publicado' && status !== 'published') return false
      }

      return true
    })
  }, [sponsors, searchQuery, activeFilters, articleBySponsor])

  const hasActiveFilters =
    activeFilters.tiers.length > 0 || activeFilters.logoBlanco !== 'all' || activeFilters.articulo !== 'all'
  const activeFilterCount =
    activeFilters.tiers.length + (activeFilters.logoBlanco !== 'all' ? 1 : 0) + (activeFilters.articulo !== 'all' ? 1 : 0)

  const toggleTierFilter = (tier: string) => {
    setActiveFilters(prev => ({
      ...prev,
      tiers: prev.tiers.includes(tier) ? prev.tiers.filter(t => t !== tier) : [...prev.tiers, tier],
    }))
  }

  const clearFilters = () => setActiveFilters({ tiers: [], logoBlanco: 'all', articulo: 'all' })

  const handleArticleSaved = useCallback(
    (sponsorId: string | number, newStatus: 'draft' | 'published', newCategoria?: string | null) => {
      setArticles(prev => {
        const idx = prev.findIndex(a => String(toId(a.sponsor)) === String(sponsorId))
        if (idx === -1) return [...prev, { sponsor: sponsorId, status: newStatus, categoria: newCategoria ?? null }]
        const copy = [...prev]
        copy[idx] = { ...copy[idx], status: newStatus, categoria: newCategoria ?? null }
        return copy
      })
    },
    [],
  )

  if (selectedSponsor) {
    return (
      <ArticuloEditor
        key={String(selectedSponsor.id)}
        sponsor={selectedSponsor}
        onBack={() => setSelectedSponsorId(null)}
        onSaved={handleArticleSaved}
      />
    )
  }

  return (
    <div style={{ padding: '1.75rem 2rem', minHeight: '100%' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>Artículos</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--theme-elevation-500)', margin: '0.25rem 0 0' }}>
          Onepagers por sponsor — selecciona una cuenta para editar su artículo
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar sponsor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                background: 'var(--theme-elevation-50)',
                border: '1px solid var(--theme-elevation-200)',
                borderRadius: '6px',
                color: 'var(--theme-text)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.875rem',
              background: filtersOpen || hasActiveFilters ? 'var(--theme-text)' : 'transparent',
              color: filtersOpen || hasActiveFilters ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: `1px solid ${filtersOpen || hasActiveFilters ? 'var(--theme-text)' : 'var(--theme-elevation-200)'}`,
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filtros{hasActiveFilters ? ` · ${activeFilterCount}` : ''}
          </button>
        </div>

        {filtersOpen && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '1rem',
              background: 'var(--theme-elevation-50)',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
            }}
          >
            <div>
              <label style={labelStyle}>Tier</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {TIER_FILTER_OPTIONS.map(tier => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => toggleTierFilter(tier)}
                    style={chipButtonStyle(activeFilters.tiers.includes(tier))}
                  >
                    {tier}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => toggleTierFilter(NO_TIER_VALUE)}
                  style={chipButtonStyle(activeFilters.tiers.includes(NO_TIER_VALUE))}
                >
                  Sin tier
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Logo blanco</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveFilters(prev => ({ ...prev, logoBlanco: prev.logoBlanco === 'con' ? 'all' : 'con' }))}
                  style={chipButtonStyle(activeFilters.logoBlanco === 'con')}
                >
                  Con logo blanco
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilters(prev => ({ ...prev, logoBlanco: prev.logoBlanco === 'sin' ? 'all' : 'sin' }))}
                  style={chipButtonStyle(activeFilters.logoBlanco === 'sin')}
                >
                  Sin logo blanco
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Artículo</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveFilters(prev => ({ ...prev, articulo: prev.articulo === 'con' ? 'all' : 'con' }))}
                  style={chipButtonStyle(activeFilters.articulo === 'con')}
                >
                  Con artículo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilters(prev => ({ ...prev, articulo: prev.articulo === 'sin' ? 'all' : 'sin' }))}
                  style={chipButtonStyle(activeFilters.articulo === 'sin')}
                >
                  Sin artículo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilters(prev => ({ ...prev, articulo: prev.articulo === 'publicado' ? 'all' : 'publicado' }))}
                  style={chipButtonStyle(activeFilters.articulo === 'publicado')}
                >
                  Publicado
                </button>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--theme-elevation-500)' }}>
          {filteredSponsors.length} sponsor{filteredSponsors.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', padding: '2rem 0' }}>Cargando sponsors…</p>
      ) : sponsors.length === 0 ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', padding: '2rem 0' }}>No hay sponsors registrados.</p>
      ) : filteredSponsors.length === 0 ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', padding: '2rem 0' }}>
          No hay sponsors que coincidan con la búsqueda o los filtros.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {filteredSponsors.map(sponsor => {
            const article = articleBySponsor.get(String(sponsor.id))
            const status: ArticleStatus = article ? (article.status === 'published' ? 'published' : 'draft') : 'none'
            return (
              <SponsorCard
                key={String(sponsor.id)}
                sponsor={sponsor}
                status={status}
                onClick={() => setSelectedSponsorId(sponsor.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
