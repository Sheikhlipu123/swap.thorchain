import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getQuotes } from '@/lib/api'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => ({})) as { sourceAsset?: string }
  const sourceAsset = body.sourceAsset?.trim()
  if (!sourceAsset) return NextResponse.json({ error: 'Select a payment asset' }, { status: 400 })

  const result = await db.execute(sql`SELECT amount, asset, chain, destination_address, status, expires_at FROM payment_requests WHERE public_id = ${id} LIMIT 1`)
  const payment = result.rows[0] as Record<string, unknown> | undefined
  if (!payment) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })
  if (payment.status === 'expired' || (payment.expires_at && new Date(String(payment.expires_at)) < new Date())) return NextResponse.json({ error: 'Payment request has expired' }, { status: 410 })

  try {
    const routes = await getQuotes({
      sellAsset: sourceAsset,
      buyAsset: `${String(payment.chain)}.${String(payment.asset)}`,
      sellAmount: String(payment.amount),
      destinationAddress: String(payment.destination_address),
      slippage: 99,
      dry: true,
    })
    const route = routes?.[0] as Record<string, unknown> | undefined
    return NextResponse.json({ quote: route ? { inputAmount: route.sellAmount ?? route.inAmount, inputAsset: sourceAsset, outputAmount: route.buyAmount ?? route.outAmount, route: route.provider ?? route.providerName, expiry: route.expiry } : null })
  } catch {
    return NextResponse.json({ error: 'No route is currently available for this asset' }, { status: 503 })
  }
}
