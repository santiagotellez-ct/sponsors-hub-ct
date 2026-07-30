/** Vercel Functions reject request bodies over ~4.5 MB — stay under 4 MB. */
export const UPLOAD_MAX_BYTES = 4 * 1024 * 1024

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function readBlobAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen'))),
      type,
      quality,
    )
  })
}

function scaleToFit(width: number, height: number, maxWidth: number, maxHeight: number) {
  if (width <= maxWidth && height <= maxHeight) return { width, height }
  const scale = Math.min(maxWidth / width, maxHeight / height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export type CompressImageOptions = {
  maxBytes?: number
  maxWidth?: number
  maxHeight?: number
  mimeType?: 'image/jpeg' | 'image/webp'
}

/**
 * Shrinks and re-encodes an image in the browser so uploads stay under Vercel's
 * 4.5 MB function body limit.
 */
export async function compressImageForUpload(
  input: File | Blob,
  filename?: string,
  options: CompressImageOptions = {},
): Promise<File> {
  const {
    maxBytes = UPLOAD_MAX_BYTES,
    maxWidth = 2160,
    maxHeight = 2700,
    mimeType = 'image/jpeg',
  } = options

  const dataUrl = await readBlobAsDataURL(input)
  const img = await loadImageElement(dataUrl)
  const fitted = scaleToFit(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight)

  const canvas = document.createElement('canvas')
  canvas.width = fitted.width
  canvas.height = fitted.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')

  ctx.drawImage(img, 0, 0, fitted.width, fitted.height)

  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg'
  let quality = 0.92
  let blob = await canvasToBlob(canvas, mimeType, quality)

  while (blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08
    blob = await canvasToBlob(canvas, mimeType, quality)
  }

  if (blob.size > maxBytes) {
    throw new Error(
      'La imagen sigue siendo demasiado grande después de comprimirla. Prueba con una foto de menor resolución.',
    )
  }

  const originalName = filename || (input instanceof File ? input.name : 'upload')
  const baseName = originalName.replace(/\.[^.]+$/, '') || 'upload'
  return new File([blob], `${baseName}.${ext}`, { type: mimeType })
}
