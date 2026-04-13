import React from 'react'

// Este es el logo completo (Aparece en el Login y en el menú lateral expandido)
export function PayloadLogo() {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}
    >
      <img
        src="/logo-colombia-tech.png"
        alt="Colombia Tech"
        style={{ maxWidth: '100%', height: 'auto', maxHeight: '60px', objectFit: 'contain' }}
      />
    </div>
  )
}

// Este es el isotipo / icono pequeño (Aparece cuando el menú lateral se colapsa)
export function PayloadIcon() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src="/icon-colombia-tech.png"
        alt="Colombia Tech Icon"
        style={{ width: '32px', height: '32px', objectFit: 'contain' }}
      />
    </div>
  )
}
