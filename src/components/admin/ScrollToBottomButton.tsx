'use client'

export function ScrollToBottomButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: '#18181b',
        color: '#fff',
        border: 'none',
        borderRadius: '999px',
        padding: '10px 18px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        lineHeight: 1,
      }}
      title="Ir al final"
    >
      ↓ Final
    </button>
  )
}

export default ScrollToBottomButton
