import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

const stripIds = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(stripIds)
  if (obj && typeof obj === 'object') {
    const { id: _id, ...rest } = obj
    return Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, stripIds(v)]))
  }
  return obj
}

export const POST = async (req: NextRequest) => {
  try {
    const { id } = await req.json()
    if (!id) return Response.json({ error: 'id requerido' }, { status: 400 })

    const payload = await getPayload({ config: configPromise })

    const original = await payload.findByID({ collection: 'plans', id, depth: 0 })
    if (!original) return Response.json({ error: 'Plan no encontrado' }, { status: 404 })

    const { id: _id, updatedAt: _u, createdAt: _c, ...planData } = original as any
    const cleanData = stripIds(planData)

    const duplicate = await payload.create({
      collection: 'plans',
      data: { ...cleanData, name: `${cleanData.name} (Copia)` },
    })

    return Response.json({ success: true, id: duplicate.id })
  } catch (e) {
    console.error('[Duplicate Plan]', e)
    return Response.json({ error: 'Error al duplicar' }, { status: 500 })
  }
}
