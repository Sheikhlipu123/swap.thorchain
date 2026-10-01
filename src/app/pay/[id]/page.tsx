'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useModeAssets } from '@/hooks/use-assets'
import type { Asset } from '@/components/swap/asset'

type Payment = { public_id: string; recipient_name?: string; amount: string; asset: string; chain: string; description?: string; status: string }
type Quote = { expectedBuyAmountDecimal?: string; expectedBuyAmount?: string; expectedSellAmountDecimal?: string; expectedSellAmount?: string; inboundAddress?: string; memo?: string; expiry?: string }

const preferredTickers = ['BTC', 'ETH', 'USDT', 'RUNE']

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!text) return {}
  try { return JSON.parse(text) as Record<string, unknown> } catch { return {} }
}

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { assets, isLoading: assetsLoading } = useModeAssets()
  const [payment, setPayment] = useState<Payment>()
  const [sourceAsset, setSourceAsset] = useState<Asset>()
  const [quote, setQuote] = useState<Quote>()
  const [quoteStatus, setQuoteStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const availableAssets = useMemo(() => (assets ?? []).filter(asset => asset.identifier !== (payment ? `${payment.chain}.${payment.asset}` : '')), [assets, payment])

  useEffect(() => {
    let active = true
    params.then(({ id }) => fetch(`/api/payments/${id}`).then(async response => {
      const data = await readJson(response)
      if (!response.ok || !data.payment) throw new Error(typeof data.error === 'string' ? data.error : 'Payment not found')
      if (active) setPayment(data.payment as Payment)
    }).catch(reason => active && setError(reason instanceof Error ? reason.message : 'Payment not found')))
    return () => { active = false }
  }, [params])

  useEffect(() => {
    if (!payment || payment.status === 'expired' || sourceAsset || assetsLoading || availableAssets.length === 0) return
    const preferred = availableAssets.find(asset => preferredTickers.includes(asset.ticker)) ?? availableAssets[0]
    setSourceAsset(preferred)
  }, [payment, sourceAsset, assetsLoading, availableAssets])

  useEffect(() => {
    if (!payment || !sourceAsset || payment.status === 'expired') return
    let active = true
    setQuote(undefined); setQuoteStatus('loading'); setError('')
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    fetch(`/api/payments/${payment.public_id}/quote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceAsset: sourceAsset.identifier, sourceAmount: payment.amount }), signal: controller.signal })
      .then(async response => { const data = await readJson(response); if (!response.ok || !data.quote) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to fetch a fresh quote'); return data.quote as Quote })
      .then(nextQuote => { if (active) { setQuote(nextQuote); setQuoteStatus('ready') } })
      .catch(reason => { if (active) { setQuoteStatus('error'); setError(reason instanceof DOMException ? 'Quote request timed out. Please try again.' : reason instanceof Error ? reason.message : 'Unable to fetch a fresh quote') } })
      .finally(() => window.clearTimeout(timeout))
    return () => { active = false; controller.abort(); window.clearTimeout(timeout) }
  }, [payment, sourceAsset])

  if (error) return <main className="grid min-h-screen place-items-center bg-[#0b0d12] px-6 text-white"><div className="text-center"><p className="text-xl">{error}</p><Link href="/" className="mt-5 inline-block text-sm text-[#a6e96b]">Return to ThorPay</Link></div></main>
  if (!payment) return <main className="grid min-h-screen place-items-center bg-[#0b0d12] text-white/50">Loading payment request…</main>
  const expired = payment.status === 'expired'
  return <main className="min-h-screen bg-[#0b0d12] px-6 py-8 text-white"><div className="mx-auto max-w-xl"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50"><ArrowLeft data-icon="inline-start" /> ThorPay</Link><section className="mt-12 rounded-3xl border border-white/10 bg-[#151820] p-7"><div className="flex items-center justify-between"><span className="text-xs tracking-widest text-white/40">PAYMENT REQUEST</span><span className="rounded-full bg-[#a6e96b]/10 px-3 py-1 text-xs text-[#a6e96b]">{expired ? 'EXPIRED' : 'ACTIVE'}</span></div><p className="mt-10 text-sm text-white/45">{payment.recipient_name || 'Someone'} is requesting</p><h1 className="mt-2 text-5xl font-semibold tracking-tight">{payment.amount} <span className="text-2xl text-white/45">{payment.asset}</span></h1>{payment.description && <p className="mt-4 text-white/60">{payment.description}</p>}<div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/8 bg-black/15 p-4 text-sm text-white/55"><ShieldCheck className="text-[#a6e96b]" /> Recipient wallet details stay private.</div>{expired ? <div className="mt-6 rounded-2xl bg-red-400/10 p-4 text-sm text-red-200">This request is no longer accepting payments.</div> : <><h2 className="mt-8 text-lg font-medium">Choose how you want to pay</h2><p className="mt-2 text-sm text-white/45">All currently supported THORChain assets are available.</p><div className="mt-5 grid max-h-72 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">{availableAssets.map(asset => <button type="button" key={asset.identifier} onClick={() => setSourceAsset(asset)} className={`rounded-2xl border px-4 py-4 text-left ${sourceAsset?.identifier === asset.identifier ? 'border-[#a6e96b] bg-[#a6e96b]/10' : 'border-white/10 bg-white/[.03]'}`}><span className="block text-sm font-medium">{asset.ticker}</span><span className="mt-1 block truncate text-xs text-white/35">{asset.chain}</span></button>)}</div><div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-xs tracking-widest text-white/40">YOU PAY</p>{quoteStatus === 'loading' && <p className="mt-3 text-white/60">Refreshing quote…</p>}{quoteStatus === 'error' && <p className="mt-3 text-sm text-red-300">{error}</p>}{quoteStatus === 'ready' && quote && <><p className="mt-2 text-3xl font-semibold">{quote.expectedSellAmountDecimal || quote.expectedSellAmount || payment.amount} <span className="text-lg text-white/45">{sourceAsset?.ticker}</span></p><p className="mt-4 text-sm text-white/55">Send to the secure THORChain deposit address shown after continuing.</p><p className="mt-2 text-sm text-white/45">You receive {payment.amount} {payment.asset}</p></>}<button type="button" disabled={quoteStatus !== 'ready'} className="mt-5 w-full rounded-full bg-[#a6e96b] px-4 py-3 font-medium text-[#10130d] disabled:cursor-not-allowed disabled:opacity-40">Pay {payment.amount} {payment.asset}</button></div></>}</section></div></main>
}
