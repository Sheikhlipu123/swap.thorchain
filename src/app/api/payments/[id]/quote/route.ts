import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getQuotes } from '@/lib/api'
import { getAffiliateConfig } from '@/lib/thorpay-affiliate'

const schema = z.object({ sourceAsset: z.string().trim().min(2).max(120), sourceAmount: z.string().trim().regex(/^\d+(\.\d+)?$/) })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid quote request' }, { status: 400 })
  const response = await fetch(new URL(`/api/payments/${id}`, request.url))
  const data = await response.json()
  if (!response.ok || !data.payment) return NextResponse.json({ error: data.error ?? 'Payment not found' }, { status: response.status })
  if (data.payment.status === 'expired') return NextResponse.json({ error: 'This payment request has expired' }, { status: 410 })

  try {
    const routes = await getQuotes({
      sellAsset: parsed.data.sourceAsset,
      sellAmount: parsed.data.sourceAmount,
      buyAsset: `${data.payment.chain}.${data.payment.asset}`,
      slippage: 99,
      providers: ['THORCHAIN'],
      affiliate: getAffiliateConfig().thorname,
      affiliateBps: getAffiliateConfig().bps
    } as never)
    const quote = routes[0]
    if (!quote) return NextResponse.json({ error: 'No route available for this asset' }, { status: 422 })
    return NextResponse.json({ quote })
  } catch {
    return NextResponse.json({ error: 'Unable to fetch a fresh quote' }, { status: 502 })
  }
}
