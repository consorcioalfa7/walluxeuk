import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { items, totalAmount, customerEmail, customerName } = await req.json()

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Valor total inválido.' }, { status: 400 })
    }

    // 1. Criar a Encomenda na Base de Dados local (SQLite) como PENDING
    const newOrder = await db.order.create({
      data: {
        amount: totalAmount,
        currency: 'EUR',
        status: 'PENDING',
        method: 'xpayments',
        customerEmail: customerEmail || 'cliente@walluxe.com',
        customerName: customerName || 'Cliente Walluxe',
        items: items ? JSON.stringify(items) : null,
      },
    })

    console.log(
      `[XPayments] Order ${newOrder.id} created — €${newOrder.amount} [PENDING]`,
    )

    // 2. Pedir Sessão à XPayments
    const xpaymentsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_XPAYMENTS_API}/api/v1/checkout/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.XPAYMENTS_SECRET_KEY}`,
        },
        body: JSON.stringify({
          storeId: process.env.XPAYMENTS_STORE_ID,
          amountFiat: totalAmount,
          currency: 'EUR',
          orderId: newOrder.id,
          customerDetails: {
            email: customerEmail || 'cliente@walluxe.com',
            fullName: customerName || 'Cliente Walluxe',
          },
        }),
      },
    )

    const session = await xpaymentsResponse.json()

    if (!session.success) {
      return NextResponse.json({ error: session.error }, { status: 400 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[XPayments API Error]:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar sessão de pagamento' },
      { status: 500 },
    )
  }
}