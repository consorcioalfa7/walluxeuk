import { NextRequest, NextResponse } from 'next/server'

const NEXFLOWX_ENDPOINT = 'https://api.nexflowx.tech/api/v1/payment-links'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, total } = body

    if (!total || total <= 0) {
      return NextResponse.json({ error: 'Valor total inválido.' }, { status: 400 })
    }

    const apiKey = process.env.NEXFLOWX_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key não configurada. Defina NEXFLOWX_API_KEY nas Environment Variables.' },
        { status: 500 },
      )
    }

    const orderId = `WALLUXE-${Date.now().toString(36).toUpperCase()}`
    const itemsDescription = items
      ? items.map((i: { quantity: number; name: string }) => `${i.quantity}x ${i.name}`).join(', ')
      : 'Walluxe Order'

    const payload = {
      amount: Number(total),
      currency: 'EUR',
      metadata: {
        order_id: orderId,
        product: itemsDescription,
      },
    }

    const response = await fetch(NEXFLOWX_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null) || await response.text()
      return NextResponse.json(
        { error: typeof errorBody === 'object' ? errorBody?.error || errorBody?.message || 'Erro no gateway' : String(errorBody) },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
