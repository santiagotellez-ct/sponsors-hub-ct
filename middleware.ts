import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Payload guarda automáticamente un token en esta cookie al hacer login con auth: true
  const token = request.cookies.get('payload-token')

  // Si intentan entrar a cualquier ruta que empiece con /dashboard y NO tienen token...
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    // Los pateamos de vuelta al login
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si intentan entrar al login (/) y YA tienen token...
  if (request.nextUrl.pathname === '/' && token) {
    // Los mandamos directo al dashboard para que no vuelvan a loguearse
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Aquí le decimos a Next.js en qué rutas exactas debe ejecutar este middleware
export const config = {
  matcher: ['/', '/dashboard/:path*'],
}
