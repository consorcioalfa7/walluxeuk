import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_STATUSES = [
  'payment',
  'preparing',
  'shipped',
  'transit',
  'expected',
  'delivered',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status inválido. Use: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ order })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao atualizar encomenda.' },
      { status: 500 },
    )
  }
}
