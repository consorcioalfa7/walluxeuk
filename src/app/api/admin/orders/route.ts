import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao listar encomendas.' },
      { status: 500 },
    )
  }
}
