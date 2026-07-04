import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    // Se a XPayments confirmar que o pagamento foi um sucesso
    if (payload.event === 'payment.success') {
      const { transactionId, amount, customer } = payload.data

      // O orderId foi enviado por nós na criação e a XPayments devolve-o
      const orderId =
        payload.data.orderId ||
        payload.data.name?.replace('Order #', '')

      if (orderId) {
        // Atualiza a encomenda na SQLite para PAGA
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