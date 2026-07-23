'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import Cropper from 'react-easy-crop'

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
}: {
  image: string
  crop: { x: number; y: number }
  zoom: number
  onCropChange: (crop: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void
  onConfirm: () => void
  onCancel: () => void
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
        <button type="button" onClick={onCancel} style={{ ...buttonSecondary, background: 'var(--theme-bg)' }}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} style={buttonPrimary}>
          Confirmar
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
  onSaved: (sponsorId: string | number, status: 'draft' | 'published') => void
}) {
  const [loadingArticle, setLoadingArticle] = useState(true)
  const [articleId, setArticleId] = useState<string | number | null>(null)
  const [eventId, setEventId] = useState<string | number | null>(null)
  const [datoImpactante, setDatoImpactante] = useState('')
  const [articuloCorto, setArticuloCorto] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [slug, setSlug] = useState('')
  const [publishedAt, setPublishedAt] = useState<string | null>(null)

  const [imagenId, setImagenId] = useState<string | number | null>(null)
  const [imageSourceId, setImageSourceId] = useState<string | number | null>(null)
  const [imageSourceUrl, setImageSourceUrl] = useState<string | null>(null) // existing media, from server
  const [imageSourceFile, setImageSourceFile] = useState<File | null>(null) // newly picked, pending upload
  const [imageSourcePreview, setImageSourcePreview] = useState<string | null>(null) // base64 for the new file

  const [imageCrop, setImageCrop] = useState({ x: 0, y: 0, zoom: 1 })
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const preConfirmState = useRef<{ file: File | null; preview: string | null; crop: { x: number; y: number; zoom: number } } | null>(null)

  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    preConfirmState.current = { file: imageSourceFile, preview: imageSourcePreview, crop: imageCrop }
    setImageSourceFile(file)
    setImageSourcePreview(dataUrl)
    setImageCrop({ x: 0, y: 0, zoom: 1 })
    setCroppedAreaPixels(null)
    setCropModalOpen(true)
  }

  const handleCropCancel = () => {
    if (preConfirmState.current) {
      setImageSourceFile(preConfirmState.current.file)
      setImageSourcePreview(preConfirmState.current.preview)
      setImageCrop(preConfirmState.current.crop)
    }
    setCropModalOpen(false)
  }

  const handleCropConfirm = () => {
    setCropModalOpen(false)
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

  async function uploadMedia(file: File): Promise<string | number> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/media', { method: 'POST', credentials: 'include', body: formData })
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
        finalImageSourceId = await uploadMedia(imageSourceFile)
      }

      // The exported PNG is the final artifact for this article, so we
      // (re)generate and upload it as `imagen` on every save when there's
      // a source image, rather than requiring a separate manual export step.
      let finalImagenId = imagenId
      if (previewImageUrl) {
        const blob = await captureFullResPng()
        if (blob) {
          const filename = `${slug || slugify(sponsor.companyName) || 'sponsor'}-1080x1350.png`
          finalImagenId = await uploadMedia(new File([blob], filename, { type: 'image/png' }))
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

      setArticleId(savedDoc.id)
      setStatus(targetStatus)
      setSlug(finalSlug)
      setPublishedAt(finalPublishedAt)
      setImagenId(finalImagenId ?? null)
      setImageSourceId(finalImageSourceId ?? null)
      setImageSourceFile(null)
      setSaveMessage({ type: 'success', text: targetStatus === 'published' ? 'Artículo publicado.' : 'Borrador guardado.' })
      onSaved(sponsor.id, targetStatus)
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err?.message || 'Error al guardar el artículo' })
    } finally {
      setSaving(null)
    }
  }

  const tierColor = sponsor.tier ? TIER_COLORS[sponsor.tier] : null

  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      {cropModalOpen && imageSourcePreview && (
        <CropModal
          image={imageSourcePreview}
          crop={{ x: imageCrop.x, y: imageCrop.y }}
          zoom={imageCrop.zoom}
          onCropChange={c => setImageCrop(prev => ({ ...prev, x: c.x, y: c.y }))}
          onZoomChange={z => setImageCrop(prev => ({ ...prev, zoom: z }))}
          onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
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
                    transform: `translate(${imageCrop.x}px, ${imageCrop.y}px) scale(${imageCrop.zoom})`,
                    transformOrigin: 'top left',
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
              <img
                src="/logo-colombia-tech.png"
                alt="Colombia Tech Week"
                style={{ height: '38.67px', width: '104.5px', objectFit: 'contain' }}
              />
              {/* TODO: no Colombia Tech Fest asset exists in /public yet — replace with the
                  final local asset once it's added, then drop this Figma MCP URL. */}
              <img
                src="https://www.figma.com/api/mcp/asset/6e8ec906-e2c3-4df4-bab9-4da8acf69f93"
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

export const ArticulosClient: React.FC = () => {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | number | null>(null)

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

  const handleArticleSaved = useCallback((sponsorId: string | number, newStatus: 'draft' | 'published') => {
    setArticles(prev => {
      const idx = prev.findIndex(a => String(toId(a.sponsor)) === String(sponsorId))
      if (idx === -1) return [...prev, { sponsor: sponsorId, status: newStatus }]
      const copy = [...prev]
      copy[idx] = { ...copy[idx], status: newStatus }
      return copy
    })
  }, [])

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

      {loading ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', padding: '2rem 0' }}>Cargando sponsors…</p>
      ) : sponsors.length === 0 ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', padding: '2rem 0' }}>No hay sponsors registrados.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {sponsors.map(sponsor => {
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
