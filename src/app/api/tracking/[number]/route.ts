import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  try {
    const { number: trackingNumber } = await params

    if (!trackingNumber || trackingNumber.length < 3) {
      return NextResponse.json(
        { error: 'Número de rastreio inválido.' },
        { status: 400 },
      )
    }

    const order = await db.order.findUnique({
      where: { trackingNumber: trackingNumber.toUpperCase() },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Encomenda não encontrada.' },
        { status: 404 },
      )
    }

    const statusTimeline = [
      { key: 'payment', label: 'Em pagamento' },
      { key: 'preparing', label: 'Em preparação' },
      { key: 'shipped', label: 'Saída do armazém' },
      { key: 'transit', label: 'Em transporte' },
      { key: 'expected', label: 'Entrega prevista' },
      { key: 'delivered', label: 'Entregue' },
    ]

    const currentStatusIndex = statusTimeline.findIndex(
      (s) => s.key === order.status,
    )

    const timeline = statusTimeline.map((status, index) => ({
      key: status.key,
      label: status.label,
      active: index === currentStatusIndex,
      completed: index < currentStatusIndex,
      upcoming: index > currentStatusIndex,
    }))

    return NextResponse.json({
      trackingNumber: order.trackingNumber,
      status: order.status,
      statusLabel: statusTimeline[currentStatusIndex]?.label || order.status,
      amount: order.amount,
      currency: order.currency,
      items: order.items,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      timeline,
    })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao pesquisar encomenda.' },
      { status: 500 },
    )
  }
}
