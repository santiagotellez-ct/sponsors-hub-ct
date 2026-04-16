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

interface EvidenceUploadedEmailProps {
  companyName?: string
  itemName: string
  benefitCategory: string
  baseUrl?: string
}

export default function EvidenceUploadedEmail({
  companyName = 'Sponsor',
  itemName = 'Publicación en Redes Sociales',
  benefitCategory = 'Marketing',
  baseUrl = 'https://tu-dominio.com', // Cámbialo cuando subas a producción
}: EvidenceUploadedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nueva evidencia subida a tu plan de patrocinio</Preview>
      <Body style={main}>
        <Container style={card}>
          {/* NOMBRE DE LA EMPRESA */}
          <Section style={header}>
            <Text style={logoText}>COLOMBIA TECH</Text>
          </Section>

          <Heading style={h1}>Nueva evidencia disponible</Heading>

          <Text style={text}>
            Hola, equipo de <strong>{companyName}</strong>.
          </Text>
          <Text style={text}>
            El equipo administrador de Colombia Tech acaba de subir una nueva evidencia que respalda
            la ejecución de uno de los beneficios de su plan de patrocinio.
          </Text>

          {/* CAJA DE DETALLES DEL BENEFICIO */}
          <Section style={detailsBox}>
            <Text style={detailKey}>Beneficio / Categoría</Text>
            <Text style={detailValue}>{benefitCategory}</Text>

            <div style={spacer}></div>

            <Text style={detailKey}>Ítem Ejecutado</Text>
            <Text style={detailValue}>{itemName}</Text>
          </Section>

          <Text style={textSmall}>
            Pueden visualizar la evidencia completa (imágenes, documentos o enlaces) ingresando a su
            panel de control en la sección de Entregables / Progreso.
          </Text>

          {/* BOTÓN VERDE LIMA */}
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`https://sponsors-hub-ct.vercel.app/dashboard/entregables`}
            >
              Ver Evidencia
            </Button>
          </Section>

          {/* FOOTER */}
          <Section style={footer}>
            <Text style={footerText}>Este es un mensaje automático del sistema Sponsors Hub.</Text>
            <Text style={footerText}>© {new Date().getFullYear()} Colombia Tech.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// --- ESTILOS MINIMALISTAS (Sober Card) ---
const main = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  padding: '60px 20px',
}

const card = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '48px 40px',
  borderRadius: '16px',
  border: '1px solid #e4e4e7',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)',
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

const detailsBox = {
  backgroundColor: '#fafafa',
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '8px',
}

const detailKey = {
  color: '#71717a',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  fontWeight: '600',
  margin: '0 0 6px',
}

const detailValue = {
  color: '#09090b',
  fontSize: '16px',
  fontWeight: '600',
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
  color: '#000000',
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
