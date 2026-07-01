import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import NuevoContenidoEmail from '@/emails/NuevoContenidoEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export const POST = async (req: NextRequest) => {
  try {
    const { recursoId, subject, body: mensajePersonalizado } = await req.json()

    if (!recursoId || !subject) {
      return Response.json({ error: 'recursoId y subject son requeridos' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    // Obtener el RecursoGlobal con sponsors populados (depth 1)
    const recurso = await (payload as any).findByID({
      collection: 'recursos-globales',
      id: recursoId,
      depth: 1,
      overrideAccess: true,
    })

    if (!recurso) {
      return Response.json({ error: 'Recurso no encontrado' }, { status: 404 })
    }

    const sponsors: any[] = recurso.sponsors || []

    if (sponsors.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'Sin sponsors asignados' })
    }

    let sent = 0
    const errors: string[] = []

    for (const sponsorRef of sponsors) {
      const sponsorId = typeof sponsorRef === 'object' ? sponsorRef.id : sponsorRef

      try {
        // Fetch sponsor completo si solo tenemos el ID
        const sponsor =
          typeof sponsorRef === 'object' && sponsorRef.contactInfo
            ? sponsorRef
            : await payload.findByID({
                collection: 'sponsors',
                id: sponsorId,
                depth: 0,
                overrideAccess: true,
              })

        const email = sponsor.contactInfo?.corporateEmail || sponsor.email
        if (!email) continue

        await resend.emails.send({
          from: 'Colombia Tech <hola@sponsor.colombiatechweek.co>',
          to: email,
          subject,
          react: NuevoContenidoEmail({
            companyName: sponsor.companyName,
            tipo: 'recurso',
            nombreContenido: recurso.nombre,
            mensajePersonalizado: mensajePersonalizado || undefined,
          }),
        })

        sent++
        console.log(`[notify] Correo enviado a ${email} (${sponsor.companyName})`)
      } catch (e: any) {
        console.error(`[notify] Error enviando a sponsor ${sponsorId}:`, e?.message || e)
        errors.push(String(sponsorId))
      }
    }

    return Response.json({
      success: true,
      sent,
      failed: errors.length,
      ...(errors.length > 0 ? { failedIds: errors } : {}),
    })
  } catch (e: any) {
    console.error('[notify] Error general:', e)
    return Response.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
