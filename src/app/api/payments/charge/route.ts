import { NextResponse } from 'next/server'

/**
 * XPay V3 — S2S Charge Route
 *
 * Endpoint: POST /payments/charge
 * Auth: x-api-key header
 * Amount: integer in CENTS (1400 = 14.00€)
 * Methods: ["mb_way"] | ["multibanco"]
 */

const XPAY_API_URL = 'https://api.xpayments.digital/api/v1/payments/charge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      amount,
      paymentMethod,
      customerName,
      customerEmail,
      customerPhone,
      orderId,
    } = body

    // 1. Validate amount (must be integer cents > 0)
    const amountCents = Math.round(Number(amount) * 100)
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Valor total inválido.' },
        { status: 400 },
      )
    }

    // 2. Validate payment method
    if (!paymentMethod || !['mb_way', 'multibanco'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Método de pagamento inválido.' },
        { status: 400 },
      )
    }

    // 3. Get API key
    const apiKey = process.env.XPAY_SECRET_KEY
    if (!apiKey) {
      console.error('[Walluxe] XPAY_SECRET_KEY não configurada')
      return NextResponse.json(
        { error: 'Configuração de pagamento indisponível.' },
        { status: 500 },
      )
    }

    // 4. Generate order ID if not provided
    const finalOrderId =
      orderId || `WLX-${Date.now().toString(36).toUpperCase()}`

    // 5. Build customer object
    const customer: Record<string, string> = { name: customerName || 'Cliente Walluxe' }
    if (customerEmail) customer.email = customerEmail
    if (customerPhone) customer.phone = customerPhone

    // 6. Build S2S payload per XPay V3 contract
    const payload = {
      amount: amountCents,
      currency: 'EUR',
      payment_method_types: [paymentMethod],
      metadata: {
        order_id: finalOrderId,
      },
      customer,
    }

    console.log(
      `[Walluxe] XPay Charge — ${paymentMethod} — ${finalOrderId} — €${(amountCents / 100).toFixed(2)}`,
    )

    // 7. S2S call with x-api-key header
    const xpRes = await fetch(XPAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })

    const xpData = await xpRes.json()

    if (!xpRes.ok || !xpData.success) {
      console.error('[Walluxe] XPay Error:', xpData)
      return NextResponse.json(
        { error: xpData.error || 'Erro no Gateway de Pagamento' },
        { status: xpRes.status || 400 },
      )
    }

    console.log(
      `[Walluxe] XPay ${paymentMethod} initiated — ${finalOrderId} — status: ${xpData.status}`,
    )

    return NextResponse.json({
      success: true,
      status: xpData.status,
      method: xpData.method,
      action: xpData.action,
      orderId: finalOrderId,
    })
  } catch (error) {
    console.error('[Walluxe] XPay Network Error:', error)
    return NextResponse.json(
      { error: 'Erro de comunicação com o Gateway' },
      { status: 500 },
    )
  }
}