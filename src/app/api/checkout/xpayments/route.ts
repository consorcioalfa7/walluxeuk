import { NextResponse } from 'next/server'

/**
 * Stateless XPayments Checkout Route — V2 Contract
 *
 * Generates a checkout session via XPayments API V2.
 * No local database — XPayments is the single source of truth.
 *
 * V2 S2S Contract Rules:
 * - Endpoint: POST /api/v1/checkout/session (SINGULAR)
 * - Authorization: Bearer prefix is STRICTLY REQUIRED
 * - storeId: omit entirely if missing/invalid, NEVER send empty string
 * - Body: { amountFiat, currency, storeId?, metadata: { orderId } }
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

    // V2: XPAYMENTS_API_KEY is the ONLY required env var
    const apiKey = process.env.XPAYMENTS_API_KEY
    if (!apiKey) {
      console.error('[XPayments V2] Missing XPAYMENTS_API_KEY')
      return NextResponse.json(
        { error: 'Configuração de pagamento indisponível.' },
        { status: 500 },
      )
    }

    const trackingNumber = generateTrackingNumber()

    console.log(
      `[XPayments V2] Creating session — ${trackingNumber} — €${totalAmount} — ${items?.length || 0} items`,
    )

    // V2: Build request body per strict contract
    // storeId is OPTIONAL — omit entirely if not set, NEVER send empty string
    const storeId = process.env.XPAYMENTS_STORE_ID

    const requestBody: Record<string, unknown> = {
      amountFiat: totalAmount,
      currency: 'EUR',
      ...(storeId ? { storeId } : {}),
      metadata: {
        orderId: trackingNumber,
        customerName: customerName || 'Cliente Walluxe',
        customerEmail: customerEmail || 'guest@walluxe.com',
        shippingAddress: shippingAddress || null,
        items: items || [],
        itemCount: items?.length || 0,
        totalItems: items?.reduce(
          (sum: number, i: { quantity: number }) => sum + i.quantity,
          0,
        ) || 0,
      },
    }

    const xpRes = await fetch(
      'https://api.xpayments.digital/api/v1/checkout/session',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // V2: 'Bearer ' prefix is STRICTLY REQUIRED
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      },
    )

    const session = await xpRes.json()

    if (!session.success) {
      console.error('[XPayments V2] Session creation failed:', session.error)
      return NextResponse.json(
        { error: session.error || 'Erro ao criar sessão de pagamento.' },
        { status: 400 },
      )
    }

    console.log(
      `[XPayments V2] Session created — ${trackingNumber} → ${session.url}`,
    )

    return NextResponse.json({
      url: session.url,
      trackingNumber,
    })
  } catch (error) {
    console.error('[XPayments V2 API Error]:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar sessão de pagamento.' },
      { status: 500 },
    )
  }
}