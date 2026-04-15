import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  companyName?: string
  email: string
  passwordTemp: string
  baseUrl?: string
}

export default function WelcomeEmail({
  companyName = 'Sponsor',
  email = 'correo@empresa.com',
  passwordTemp = '********',
  baseUrl = 'https://tu-dominio.com', // Cámbialo cuando subas a producción
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tus credenciales de acceso a Sponsors Hub</Preview>
      <Body style={main}>
        <Container style={card}>
          {/* NOMBRE DE LA EMPRESA (Reemplazo del logo) */}
          <Section style={header}>
            <Text style={logoText}>COLOMBIA TECH</Text>
          </Section>

          <Heading style={h1}>Tus accesos están listos</Heading>

          <Text style={text}>
            Hola, equipo de <strong>{companyName}</strong>.
          </Text>
          <Text style={text}>
            Su cuenta en la plataforma de gestión de patrocinios ha sido creada exitosamente. A
            continuación, les compartimos sus credenciales de acceso para que puedan ingresar al
            dashboard.
          </Text>

          {/* CAJA DE CREDENCIALES SUTIL */}
          <Section style={credentialsBox}>
            <Text style={credentialKey}>Usuario / Correo</Text>
            <Text style={credentialValue}>{email}</Text>

            <div style={spacer}></div>

            <Text style={credentialKey}>Contraseña temporal</Text>
            <Text style={credentialValue}>{passwordTemp}</Text>
          </Section>

          <Text style={textSmall}>
            Por motivos de seguridad, les recomendamos cambiar su contraseña desde la configuración
            de su cuenta al ingresar por primera vez.
          </Text>

          {/* BOTÓN VERDE LIMA */}
          <Section style={buttonContainer}>
            <Button style={button} href={`https://prueba.tllz.cloud/login`}>
              Ingresar al Dashboard
            </Button>
          </Section>

          {/* FOOTER */}
          <Section style={footer}>
            <Text style={footerText}>
              Si tienen problemas para ingresar, respondan a este correo para recibir soporte.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// --- ESTILOS MINIMALISTAS (Sober Card) ---
const main = {
  backgroundColor: '#f4f4f5', // Fondo gris muy claro para resaltar la tarjeta
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  padding: '60px 20px',
}

const card = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '48px 40px',
  borderRadius: '16px', // Tarjeta con bordes suaves
  border: '1px solid #e4e4e7',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)', // Sombra muy sutil
  maxWidth: '520px',
}

const header = {
  marginBottom: '32px',
}

const logoText = {
  color: '#09090b',
  fontSize: '18px',
  fontWeight: '800',
  letterSpacing: '1px',
  margin: '0',
}

const h1 = {
  color: '#09090b',
  fontSize: '24px',
  fontWeight: '700',
  letterSpacing: '-0.5px',
  margin: '0 0 24px',
  padding: '0',
}

const text = {
  color: '#52525b',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const textSmall = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '24px 0 32px',
}

const credentialsBox = {
  backgroundColor: '#fafafa', // Fondo ligeramente gris para separar visualmente
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '8px',
}

const credentialKey = {
  color: '#71717a',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  fontWeight: '600',
  margin: '0 0 6px',
}

const credentialValue = {
  color: '#09090b',
  fontSize: '16px',
  fontWeight: '600',
  fontFamily: 'monospace',
  margin: '0',
}

const spacer = {
  height: '16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '16px',
}

const button = {
  backgroundColor: '#A3E635', // Verde Lima
  borderRadius: '8px',
  color: '#000000', // Texto negro para contraste
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 0',
}

const footer = {
  marginTop: '40px',
  borderTop: '1px solid #f4f4f5',
  paddingTop: '24px',
}

const footerText = {
  color: '#a1a1aa',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
}
