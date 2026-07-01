'use client'

import { useState, useEffect, useRef } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export function RecursosGlobalesNotify() {
  const [showModal, setShowModal] = useState(false)
  const [subject, setSubject] = useState('Tienes un nuevo recurso disponible | Sponsor Hub')
  const [body, setBody] = useState('El equipo de Colombia Tech ha añadido un nuevo recurso a tu cuenta. Puedes consultarlo y descargarlo desde la sección Recursos de tu portal.')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { id, savedDocumentData } = useDocumentInfo()

  const lastSavedAtRef = useRef<string | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    const updatedAt = savedDocumentData?.updatedAt as string | undefined
    if (!updatedAt) return

    if (!initializedRef.current) {
      initializedRef.current = true
      lastSavedAtRef.current = updatedAt
      return
    }

    if (updatedAt !== lastSavedAtRef.current) {
      lastSavedAtRef.current = updatedAt
      setShowModal(true)
      setSendResult('idle')
      setErrorMsg('')
    }
  }, [savedDocumentData?.updatedAt])

  const handleSend = async () => {
    if (!id) return
    setSending(true)
    setSendResult('idle')
    setErrorMsg('')

    try {
      const res = await fetch('/api/recursos-globales/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recursoId: id, subject, body }),
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

  const fieldDisabled = sending || sendResult === 'success'

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
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#09090b' }}>
            Notificar a Sponsors
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#71717a', lineHeight: '1.5' }}>
            El recurso fue guardado. Puedes enviar un correo a todos los sponsors asignados.
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
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
            disabled={fieldDisabled}
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
              background: fieldDisabled ? '#f9f9f9' : '#fff',
            }}
          />
        </div>

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
            Mensaje del correo
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={fieldDisabled}
            rows={4}
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
              resize: 'vertical',
              background: fieldDisabled ? '#f9f9f9' : '#fff',
            }}
          />
        </div>

        {sendResult === 'success' && (
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#16a34a', fontWeight: 500 }}>
            ✓ Correos enviados correctamente
          </p>
        )}
        {sendResult === 'error' && (
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#dc2626' }}>
            Error: {errorMsg}
          </p>
        )}

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
              background: sending || sendResult === 'success' ? '#71717a' : '#09090b',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: sending || sendResult === 'success' ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {sending ? 'Enviando...' : 'Enviar correo'}
          </button>
        </div>
      </div>
    </div>
  )
}
