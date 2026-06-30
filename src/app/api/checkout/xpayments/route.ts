import { NextResponse } from 'next/server'

/**
 * Stateless XPayments Checkout Route
 *
 * Generates a checkout session via XPayments API.
 * No local database — cart items are sent in metadata.
 * XPayments is the single source of truth for order/payment state.
 */

function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `WLX-${code}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, totalAmount, customerEmail, customerName, shippingAddress } = body

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valor total inválido.' },
        { status: 400 },
      )
    }

    const trackingNumber = generateTrackingNumber()
    const xpaymentsApi = process.env.NEXT_PUBLIC_XPAYMENTS_API
    const secretKey = process.env.XPAYMENTS_SECRET_KEY
    const storeId = process.env.XPAYMENTS_STORE_ID

    if (!secretKey || !storeId || !xpaymentsApi) {
      console.error('[XPayments] Missing environment variables')
      return NextResponse.json(
        { error: 'Configuração de pagamento indisponível.' },
        { status: 500 },
      )
    }

    console.log(
      `[XPayments] Creating session — ${trackingNumber} — €${totalAmount} — ${items?.length || 0} items`,
    )

    // Build metadata payload with full cart + tracking number
    const metadata: Record<string, unknown> = {
      trackingNumber,
      customerName: customerName || 'Cliente Walluxe',
      customerEmail: customerEmail || 'guest@walluxe.com',
      shippingAddress: shippingAddress || null,
      items: items || [],
      itemCount: items?.length || 0,
      totalItems: items?.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0) || 0,
    }

    const xpaymentsResponse = await fetch(
      `${xpaymentsApi}/api/v1/checkout/sessions`,
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
          orderId: trackingNumber,
          customerDetails: {
            email: customerEmail || 'guest@walluxe.com',
            fullName: customerName || 'Cliente Walluxe',
          },
          metadata,
        }),
      },
    )

    const session = await xpaymentsResponse.json()

    if (!session.success) {
      console.error('[XPayments] Session creation failed:', session.error)
      return NextResponse.json(
        { error: session.error || 'Erro ao criar sessão de pagamento.' },
        { status: 400 },
      )
    }

    console.log(`[XPayments] Session created — ${trackingNumber} → ${session.url}`)

    return NextResponse.json({
      url: session.url,
      trackingNumber,
    })
  } catch (error) {
    console.error('[XPayments API Error]:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar sessão de pagamento.' },
      { status: 500 },
    )
  }
}
