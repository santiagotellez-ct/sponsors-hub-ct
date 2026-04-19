'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export function OnboardingForm({ sponsor }: { sponsor: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados de Contacto
  const [fullName, setFullName] = useState(sponsor?.contactInfo?.fullName || '')
  const [whatsapp, setWhatsapp] = useState(sponsor?.contactInfo?.whatsapp || '')
  const [corporateEmail, setCorporateEmail] = useState(sponsor?.contactInfo?.corporateEmail || '')
  const [linkedin, setLinkedin] = useState(sponsor?.contactInfo?.linkedin || '')

  // Estados de Estrategia
  const activeParticipation = sponsor?.eventParticipations?.find((p: any) => p.isCurrent)
  const [description, setDescription] = useState(activeParticipation?.strategy?.description || '')
  const [eventObjectives, setEventObjectives] = useState(
    activeParticipation?.strategy?.eventObjectives || '',
  )
  const [brandDifferentiator, setBrandDifferentiator] = useState(
    activeParticipation?.strategy?.brandDifferentiator || '',
  )

  // Estado del Logo
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let logoId = sponsor?.logo?.id || sponsor?.logo

      // 1. Si el usuario seleccionó un logo nuevo, lo subimos a la colección 'media' de Payload
      if (logoFile) {
        const formData = new FormData()
        formData.append('file', logoFile)

        const mediaRes = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        })

        if (!mediaRes.ok) throw new Error('Error al subir el logo de la empresa.')
        const mediaData = await mediaRes.json()
        logoId = mediaData.doc.id
      }

      // 2. Preparamos el array de eventos, actualizando solo la estrategia del evento actual
      const updatedParticipations = sponsor.eventParticipations.map((p: any) => {
        // Aseguramos enviar solo los IDs para las relaciones, no los objetos completos
        const eventId = typeof p.event === 'object' ? p.event?.id : p.event
        const planId = typeof p.plan === 'object' ? p.plan?.id : p.plan

        if (p.isCurrent) {
          return {
            ...p,
            event: eventId,
            plan: planId,
            strategy: {
              description,
              eventObjectives,
              brandDifferentiator,
            },
          }
        }
        return {
          ...p,
          event: eventId,
          plan: planId,
        }
      })

      // 3. Enviamos la actualización completa al perfil del Sponsor
      const updateRes = await fetch(`/api/sponsors/${sponsor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo: logoId,
          contactInfo: {
            fullName,
            whatsapp,
            corporateEmail,
            linkedin,
          },
          eventParticipations: updatedParticipations,
        }),
      })

      if (!updateRes.ok) {
        throw new Error('Error al guardar la información. Intente nuevamente.')
      }

      // Si todo sale bien, recargamos la página para que el Server Component renderice el Dashboard real
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 mt-6">
      {/* SECCIÓN: LOGO */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">1. Identidad Visual</h3>
        <div className="grid gap-2">
          <Label htmlFor="logo">Logo de la empresa</Label>
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            required={!sponsor?.logo}
          />
          <p className="text-xs text-muted-foreground">
            Formato recomendado: PNG o SVG transparente.
          </p>
        </div>
      </div>

      {/* SECCIÓN: CONTACTO */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">2. Datos de Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Nombre completo (Contacto principal)</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="corporateEmail">Email corporativo</Label>
            <Input
              id="corporateEmail"
              type="email"
              value={corporateEmail}
              onChange={(e) => setCorporateEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp (Con código de país)</Label>
            <Input
              id="whatsapp"
              placeholder="+57 300 000 0000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="linkedin">URL de LinkedIn (Empresa o Contacto)</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: ESTRATEGIA */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">3. Estrategia de la Compañía</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Esta información es clave para alinear su participación en el evento actual.
        </p>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción de la empresa</Label>
            <Textarea
              id="description"
              placeholder="¿Qué hace su empresa y cuál es su propuesta de valor?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eventObjectives">Objetivos del evento</Label>
            <Textarea
              id="eventObjectives"
              placeholder="Ej: Generar 50 leads B2B, posicionamiento de marca, buscar talento..."
              value={eventObjectives}
              onChange={(e) => setEventObjectives(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="brandDifferentiator">Diferenciador de marca</Label>
            <Textarea
              id="brandDifferentiator"
              placeholder="¿Qué los hace únicos frente a la competencia?"
              value={brandDifferentiator}
              onChange={(e) => setBrandDifferentiator(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm font-medium text-destructive bg-destructive/10 py-3 px-4 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando información...
            </>
          ) : (
            'Completar perfil y entrar'
          )}
        </Button>
      </div>
    </form>
  )
}
