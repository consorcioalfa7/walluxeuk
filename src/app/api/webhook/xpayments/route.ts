import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const signature = request.headers.get('x-xpayments-signature')

    if (!signature) {
      console.warn(
        '[XPayments Webhook] Signature missing — rejecting request',
      )
      return NextResponse.json(
        { error: 'Assinatura XPayments em falta' },
        { status: 401 },
      )
    }

    // TODO: Implementar verificação HMAC-SHA256 da assinatura quando a XPayments
    // documentar o formato exato. Por agora valida-se apenas a presença do header.
    //
    // Exemplo futuro:
    // const webhookSecret = process.env.XPAYMENTS_WEBHOOK_SECRET
    // const rawBody = await request.text()
    // const expectedSignature = crypto
    //   .createHmac('sha256', webhookSecret!)
    //   .update(rawBody)
    //   .digest('hex')
    // if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const event = payload.event as string
    const data = payload.data as Record<string, unknown> | undefined

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Payload do webhook inválido' },
        { status: 400 },
      )
    }

    console.log(`[XPayments Webhook] Event: ${event}`, {
      transactionId: data.transactionId,
      orderId: data.orderId,
    })

    if (event === 'payment.success') {
      const { transactionId, orderId } = data as {
        transactionId: string
        orderId: string
      }

      if (!orderId) {
        console.error(
          '[XPayments Webhook] Missing orderId in payment.success payload',
        )
        return NextResponse.json(
          { error: 'orderId em falta' },
          { status: 400 },
        )
      }

      const order = await db.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        console.error(
          `[XPayments Webhook] Order not found: ${orderId}`,
        )
        return NextResponse.json(
          { error: 'Encomenda não encontrada' },
          { status: 404 },
        )
      }

      if (order.status === 'preparing' || order.status === 'shipped') {
        console.log(
          `[XPayments Webhook] Order already processed: ${order.trackingNumber}`,
        )
        return NextResponse.json({
          received: true,
          trackingNumber: order.trackingNumber,
        })
      }

      const updated = await db.order.update({
        where: { id: orderId },
        data: {
          status: 'preparing',
          transactionId: transactionId || null,
          paidAt: new Date(),
        },
      })

      console.log(
        `✅ Pagamento Recebido via XPayments. Order: ${updated.trackingNumber} — €${updated.amount}`,
      )

      return NextResponse.json({
        received: true,
        trackingNumber: updated.trackingNumber,
        status: updated.status,
      })
    }

    if (event === 'payment.failed') {
      const { orderId } = data as { orderId: string }
      if (orderId) {
        await db.order
          .update({
            where: { id: orderId },
            data: { status: 'failed' },
          })
          .catch(() => {
            /* order may not exist */
          })
      }
      console.log(`[XPayments Webhook] Payment FAILED for order: ${orderId}`)
      return NextResponse.json({ received: true, status: 'failed' })
    }

    console.log(`[XPayments Webhook] Unhandled event: ${event}`)
    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('[XPayments Webhook Error]:', error)
    return NextResponse.json(
      { error: 'Erro no Webhook' },
      { status: 400 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'Walluxe XPayments Webhook Endpoint',
      version: '1.0',
    },
    { status: 200 },
  )
}