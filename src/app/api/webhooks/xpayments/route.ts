import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    if (payload.event === 'payment.success') {
      const { transactionId } = payload.data

      // O orderId foi enviado por nós na Etapa 1 e a XPayments devolve-o
      const orderId =
        payload.data.orderId ||
        payload.data.name?.replace('Order #', '')

      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            transactionId: transactionId || null,
            paidAt: new Date(),
          },
        })

        console.log(
          `✅ Pagamento Confirmado na Walluxe! Encomenda: ${orderId}`,
        )
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[XPayments Webhook Error]:', error)
    return NextResponse.json(
      { error: 'Erro ao processar Webhook' },
      { status: 400 },
    )
  }
}
