'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'

export function DashboardGreeting() {
  const { user } = useAuth()

  // Extraemos el nombre del correo o ponemos 'Administrador' por defecto
  const name = user?.email?.split('@')[0] || 'Administrador'
  // Capitalizamos la primera letra
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1)

  return (
    <div
      style={{
        marginBottom: '32px',
        padding: '32px',
        backgroundColor: '#f4f4f5',
        border: '1px solid #e4e4e7',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#09090b' }}>
        ¡Hola, {formattedName}! 👋
      </h2>
      <p style={{ margin: '8px 0 0', color: '#52525b', fontSize: '16px' }}>
        Bienvenido al panel de administración de Colombia Tech. Selecciona una opción en el menú
        lateral para gestionar los patrocinadores, eventos y planes.
      </p>
    </div>
  )
}
