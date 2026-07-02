import { NextResponse } from 'next/server'

/**
 * XPayments V2 — Server-to-Server (S2S) Checkout Route
 *
 * Contrato V2 estrito:
 * - Endpoint: POST /api/v1/checkout/session (singular)
 * - Authorization: Bearer prefix é ESTRITAMENTE OBRIGATÓRIO
 * - storeId: omitir se vazio/inválido, NUNCA enviar string vazia ""
 * - Body obrigatório: amountFiat (Number), currency
 * - metadata: { orderId, customerEmail }
 */

const XPAYMENTS_API_URL = 'https://api.xpayments.digital/api/v1/checkout/session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { totalAmount, orderId, email } = body

    // 1. Validar amount
    if (!totalAmount || Number(totalAmount) <= 0) {
      return Response.json(
        { error: 'Valor total inválido.' },
        { status: 400 },
      )
    }

    // 2. Buscar as chaves de ambiente
    const secretKey = process.env.XPAYMENTS_SECRET_KEY
    const storeId = process.env.XPAYMENTS_STORE_ID

    if (!secretKey) {
      console.error('[Walluxe] XPAYMENTS_SECRET_KEY não configurada no servidor')
      return Response.json(
        { error: 'XPAYMENTS_SECRET_KEY não configurada no servidor da Walluxe' },
        { status: 500 },
      )
    }

    // 3. Montar o payload — amountFiat obrigatório como Number
    const payload: Record<string, unknown> = {
      amountFiat: Number(totalAmount),
      currency: 'EUR',
      metadata: {
        orderId: orderId || `WLX-${Date.now().toString(36).toUpperCase()}`,
        customerEmail: email || 'guest@walluxe.com',
      },
    }

    // 4. Segurança: NUNCA enviar storeId como string vazia ""
    if (storeId && storeId.trim() !== '') {
      payload.storeId = storeId
    }

    console.log(
      `[Walluxe] XPayments V2 S2S — orderId: ${payload.metadata.orderId} — €${payload.amountFiat}`,
    )

    // 5. Chamada S2S com Bearer Token obrigatório
    const xpRes = await fetch(XPAYMENTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    })

    const xpData = await xpRes.json()

    if (!xpRes.ok || !xpData.success) {
      console.error('[Walluxe] Erro XPayments:', xpData)
      return Response.json(
        { error: xpData.error || 'Erro no Gateway' },
        { status: xpRes.status },
      )
    }

    // A XPayments devolve um url de checkout seguro
    console.log(
      `[Walluxe] XPayments V2 session criada — ${xpData.url}`,
    )

    return Response.json({
      success: true,
      checkoutUrl: xpData.url,
    })
  } catch (error) {
    console.error('[Walluxe] Falha de rede ao contactar XPayments:', error)
    return Response.json(
      { error: 'Erro de comunicação com o Gateway' },
      { status: 500 },
    )
  }
}