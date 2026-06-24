import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
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
    const webhookSecret = process.env.NEXFLOWX_WEBHOOK_SECRET
    const signature = request.headers.get('x-nexflowx-signature')

    let parsedBody: Record<string, unknown>

    if (webhookSecret && signature) {
      const rawBody = await request.text()
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature),
        )
      ) {
        console.error('[Webhook] Signature verification failed')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 },
        )
      }

      parsedBody = JSON.parse(rawBody) as Record<string, unknown>
    } else {
      console.warn(
        '[Webhook] Secret not configured — skipping signature verification',
      )
      parsedBody = (await request.json()) as Record<string, unknown>
    }

    const event = parsedBody.event as string
    const data = parsedBody.data as Record<string, unknown> | undefined

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 },
      )
    }

    console.log(`[Webhook] Event: ${event}`, {
      transactionId: data.transaction_id,
      amount: data.amount,
      email: data.customer_email,
    })

    if (
      event === 'payment.gateway_confirmed' ||
      event === 'payment.completed' ||
      event === 'payment.paid'
    ) {
      const transactionId = data.transaction_id as string
      const customerDetails = data.customer_details as
        | Record<string, string>
        | undefined

      const existing = await db.order.findUnique({
        where: { transactionId: transactionId || '' },
      })

      if (existing) {
        console.log(`[Webhook] Order already exists: ${existing.trackingNumber}`)
        return NextResponse.json({
          received: true,
          trackingNumber: existing.trackingNumber,
        })
      }

      const trackingNumber = generateTrackingNumber()
      const order = await db.order.create({
        data: {
          trackingNumber,
          transactionId: transactionId || null,
          customerEmail: (data.customer_email as string) || null,
          customerName: customerDetails?.name || (data.customer_name as string) || null,
          amount: Number(data.amount) || 0,
          currency: (data.currency as string) || 'EUR',
          country: (data.country as string) || null,
          method: (data.method as string) || null,
          status: 'preparing',
          paidAt: new Date(),
        },
      })

      console.log(
        `[Webhook] Order created: ${order.trackingNumber} — €${order.amount} for ${order.customerEmail}`,
      )

      return NextResponse.json({
        received: true,
        trackingNumber: order.trackingNumber,
        status: order.status,
      })
    }

    if (event === 'payment.failed') {
      console.log(`[Webhook] Payment FAILED: ${data.transaction_id}`)
      return NextResponse.json({ received: true, status: 'failed' })
    }

    console.log(`[Webhook] Unhandled event: ${event}`)
    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'Walluxe Webhook Endpoint', version: '2.0' },
    { status: 200 },
  )
}
