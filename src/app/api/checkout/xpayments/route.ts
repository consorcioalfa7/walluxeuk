import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `WLX-${code}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, totalAmount, customerEmail, customerName } = body

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valor total inválido.' },
        { status: 400 },
      )
    }

    const secretKey = process.env.XPAYMENTS_SECRET_KEY
    const storeId = process.env.XPAYMENTS_STORE_ID
    const apiBase = process.env.NEXT_PUBLIC_XPAYMENTS_API

    if (!secretKey || !storeId || !apiBase) {
      console.error('[XPayments Checkout] Missing environment variables')
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado.' },
        { status: 500 },
      )
    }

    const trackingNumber = generateTrackingNumber()

    // 1. Criar a Encomenda na Base de Dados local (status: pending)
    const newOrder = await db.order.create({
      data: {
        trackingNumber,
        amount: totalAmount,
        currency: 'EUR',
        status: 'pending',
        method: 'xpayments',
        customerEmail: customerEmail || 'guest@walluxe.com',
        customerName: customerName || 'Cliente Walluxe',
        items: items ? JSON.stringify(items) : null,
      },
    })

    console.log(
      `[XPayments Checkout] Order created: ${newOrder.trackingNumber} — €${newOrder.amount}`,
    )

    // 2. Pedir Sessão à XPayments
    const xpaymentsResponse = await fetch(
      `${apiBase}/api/v1/checkout/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          storeId,
          amountFiat: totalAmount,
          currency: 'EUR',
          orderId: newOrder.id,
          customerDetails: {
            email: customerEmail || 'guest@walluxe.com',
            fullName: customerName || 'Cliente Walluxe',
          },
        }),
      },
    )

    if (!xpaymentsResponse.ok) {
      const errorBody =
        (await xpaymentsResponse.json().catch(() => null)) ||
        (await xpaymentsResponse.text())

      console.error(
        '[XPayments Checkout] API Error:',
        xpaymentsResponse.status,
        errorBody,
      )

      return NextResponse.json(
        {
          error:
            typeof errorBody === 'object'
              ? (errorBody as Record<string, unknown>)?.error ||
                (errorBody as Record<string, unknown>)?.message ||
                'Erro no gateway de pagamento'
              : 'Erro no gateway de pagamento',
        },
        { status: xpaymentsResponse.status },
      )
    }

    const session = await xpaymentsResponse.json()

    if (!session.success && !session.url) {
      console.error('[XPayments Checkout] Invalid session response:', session)
      return NextResponse.json(
        { error: session.error || 'Erro ao criar sessão de pagamento' },
        { status: 400 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[XPayments Checkout Error]:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 },
    )
  }
}