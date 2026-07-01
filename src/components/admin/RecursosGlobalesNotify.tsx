'use client'

import { useState, useEffect, useRef } from 'react'
import { useFormProcessing, useDocumentInfo } from '@payloadcms/ui'

export function RecursosGlobalesNotify() {
  const [showModal, setShowModal] = useState(false)
  const [subject, setSubject] = useState('Tienes un nuevo recurso disponible | Sponsor Hub')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isProcessing = useFormProcessing()
  const { id } = useDocumentInfo()

  const prevProcessingRef = useRef(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      // Registrar el estado inicial sin disparar el modal
      initializedRef.current = true
      prevProcessingRef.current = isProcessing
      return
    }

    // Detectar transición processing=true → false (guardado completado)
    if (prevProcessingRef.current && !isProcessing) {
      setShowModal(true)
      setSendResult('idle')
      setErrorMsg('')
    }
    prevProcessingRef.current = isProcessing
  }, [isProcessing])

  const handleSend = async () => {
    if (!id) return
    setSending(true)
    setSendResult('idle')
    setErrorMsg('')

    try {
      const res = await fetch('/api/recursos-globales/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recursoId: id, subject }),
      })

      const data = await res.json()

      if (res.ok) {
        setSendResult('success')
        setTimeout(() => {
          setShowModal(false)
          setSendResult('idle')
        }, 2500)
      } else {
        setSendResult('error')
        setErrorMsg(data?.error || 'Error desconocido')
      }
    } catch (e: any) {
      setSendResult('error')
      setErrorMsg(e?.message || 'Error de red')
    } finally {
      setSending(false)
    }
  }

  if (!showModal) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '14px',
          padding: '36px 32px 28px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#09090b' }}>
            Notificar a Sponsors
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#71717a', lineHeight: '1.5' }}>
            El recurso fue guardado. Puedes enviar un correo a todos los sponsors asignados.
          </p>
        </div>

        {/* Subject input */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Asunto del correo
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending || sendResult === 'success'}
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              border: '1.5px solid #e4e4e7',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '14px',
              color: '#09090b',
              fontFamily: 'inherit',
              outline: 'none',
              background: sending || sendResult === 'success' ? '#f9f9f9' : '#fff',
            }}
          />
        </div>

        {/* Feedback */}
        {sendResult === 'success' && (
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '14px',
              color: '#16a34a',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ✓ Correos enviados correctamente
          </p>
        )}
        {sendResult === 'error' && (
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#dc2626' }}>
            Error al enviar: {errorMsg}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            disabled={sending}
            style={{
              padding: '9px 20px',
              border: '1.5px solid #e4e4e7',
              borderRadius: '8px',
              background: '#fff',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Omitir
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || sendResult === 'success' || !subject.trim() || !id}
            style={{
              padding: '9px 20px',
              border: 'none',
              borderRadius: '8px',
              background:
                sending || sendResult === 'success' ? '#71717a' : '#09090b',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: sending || sendResult === 'success' ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {sending ? 'Enviando...' : 'Enviar correo'}
          </button>
        </div>
      </div>
    </div>
  )
}
