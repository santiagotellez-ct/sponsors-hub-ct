'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter()

  // Estados para manejar los datos del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Función principal que se ejecuta al darle a "Acceder"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Llamada directa a la API nativa de Payload para la colección 'sponsors'
      const response = await fetch('/api/sponsors/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Correo o contraseña incorrectos.')
      }

      // Si es exitoso, Payload ya guardó el token en una cookie segura.
      // Forzamos un refresh para que Next.js actualice los estados y redirigimos.
      router.refresh()
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          {/* SECCIÓN DE CABECERA CON LOGO */}
          <div className="flex flex-col items-center gap-2 w-full mb-6">
            <div className="flex items-center justify-center w-full max-w-[220px] h-12 mb-2">
              <img
                src="/logo-colombia-tech.png"
                alt="Colombia Tech"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="sr-only">Colombia Tech</span>
            <FieldDescription className="text-base text-center text-balance px-2">
              Ingrese sus credenciales para acceder
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="hola@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between w-full">
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <a
                href="#"
                className="text-sm underline-offset-4 hover:underline text-muted-foreground"
              >
                ¿Olvidó su contraseña?
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </Field>

          {/* Mensaje de error dinámico */}
          {error && (
            <div className="text-sm font-medium text-destructive text-center mt-2 bg-destructive/10 py-2 rounded-md">
              {error}
            </div>
          )}

          <Field className="mt-2">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Acceder'
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center mt-4">
        Uso exclusivo para patrocinadores autorizados. Contacte al equipo si tiene problemas de
        acceso.
      </FieldDescription>
    </div>
  )
}
