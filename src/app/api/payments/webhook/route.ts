import { NextResponse } from 'next/server'

/**
 * XPay V3 — Webhook Route
 *
 * Receives payment confirmation from XPayments.
 * Logs and acknowledges receipt.
 */

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    console.log('[Walluxe] XPay Webhook received:', {
      event: payload.event || payload.type,
      status: payload.status,
      orderId: payload.metadata?.order_id,
      method: payload.method,
      amount: payload.amount,
    })

    // If payment was successful
    if (payload.status === 'paid' || payload.status === 'succeeded') {
      const orderId = payload.metadata?.order_id
      console.log(
        `[Walluxe] ✅ Pagamento Confirmado via ${payload.method} — Order: ${orderId} — Amount: ${payload.amount}`,
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Walluxe] Webhook Error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 400 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Walluxe XPay Webhook',
    version: '3.0',
  })
}