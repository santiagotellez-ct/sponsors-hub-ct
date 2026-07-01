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

interface NuevoContenidoEmailProps {
  companyName?: string
  tipo: 'recurso' | 'pieza'
  nombreContenido?: string
  mensajePersonalizado?: string
}

export default function NuevoContenidoEmail({
  companyName = 'Sponsor',
  tipo,
  nombreContenido,
  mensajePersonalizado,
}: NuevoContenidoEmailProps) {
  const isRecurso = tipo === 'recurso'
  const titulo = isRecurso ? 'Tienes un nuevo recurso disponible' : 'Tienes una nueva pieza de redes sociales'
  const preview = isRecurso ? 'Nuevo recurso disponible en tu portal' : 'Nueva pieza de redes sociales disponible'
  const descripcion = mensajePersonalizado ?? (isRecurso
    ? 'El equipo de Colombia Tech ha añadido un nuevo recurso a tu cuenta. Puedes consultarlo y descargarlo desde la sección Recursos de tu portal.'
    : 'El equipo de Colombia Tech ha preparado una nueva pieza gráfica para tus redes sociales. Encuéntrala con el copy sugerido y fecha de publicación en tu portal.')
  const href = isRecurso
    ? 'https://sponsor.colombiatechweek.co/dashboard/documentos'
    : 'https://sponsor.colombiatechweek.co/dashboard/redes-sociales'
  const btnLabel = isRecurso ? 'Ver Recursos' : 'Ver Piezas de Redes Sociales'

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={card}>
          <Section style={header}>
            <Text style={logoText}>COLOMBIA TECH</Text>
          </Section>

          <Heading style={h1}>{titulo}</Heading>

          <Text style={text}>
            Hola, equipo de <strong>{companyName}</strong>.
          </Text>
          <Text style={text}>{descripcion}</Text>

          {nombreContenido && (
            <Section style={detailsBox}>
              <Text style={detailKey}>{isRecurso ? 'Recurso' : 'Pieza'}</Text>
              <Text style={detailValue}>{nombreContenido}</Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={href}>
              {btnLabel}
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Este es un mensaje automático del sistema Sponsor Hub.</Text>
            <Text style={footerText}>© {new Date().getFullYear()} Colombia Tech.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

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
const header = { marginBottom: '32px' }
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
const detailsBox = {
  backgroundColor: '#fafafa',
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '8px',
  marginBottom: '24px',
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
const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '16px',
}
const button = {
  backgroundColor: '#09090b',
  borderRadius: '8px',
  color: '#ffffff',
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
