'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Copy, ExternalLink, ShieldCheck, WalletCards } from 'lucide-react'

type Payment = {
  public_id: string
  recipient_name?: string
  amount: string
  asset: string
  chain: string
  description?: string
  status: string
  expires_at?: string
}

type Quote = { inputAmount?: string; inputAsset?: string; outputAmount?: string; route?: string; expiry?: string }

const paymentAssets = ['BTC', 'ETH', 'USDT', 'RUNE']

async function readJson(response: Response) {
  const text = await response.text()
  if (!text) throw new Error(`Request failed (${response.status})`)
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error(`Request failed (${response.status})`)
  }
}

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const [payment, setPayment] = useState<Payment>()
  const [selectedAsset, setSelectedAsset] = useState('BTC')
  const [quote, setQuote] = useState<Quote>()
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    params.then(({ id }) => fetch(`/api/payments/${id}`).then(readJson).then((data) => {
      if (!active) return
      if (data.payment) setPayment(data.payment as unknown as Payment)
      else setError(String(data.error ?? 'Payment not found'))
    }).catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : 'Payment not found')))
    return () => { active = false }
  }, [params])

  useEffect(() => {
    if (!payment || payment.status === 'expired') return
    let active = true
    setLoadingQuote(true)
    setQuote(undefined)
    fetch(`/api/payments/${payment.public_id}/quote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceAsset: selectedAsset }),
    }).then(readJson).then((data) => {
      if (!active) return
      if (data.quote) setQuote(data.quote as Quote)
      else setError(String(data.error ?? 'Unable to refresh quote'))
    }).catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : 'Unable to refresh quote'))
      .finally(() => active && setLoadingQuote(false))
    return () => { active = false }
  }, [payment, selectedAsset])

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  if (error) return <main className="grid min-h-screen place-items-center bg-[#0b0d12] px-6 text-white"><div className="max-w-sm text-center"><p className="text-xl">{error}</p><Link href="/" className="mt-5 inline-block text-sm text-[#a6e96b]">Return to ThorPay</Link></div></main>
  if (!payment) return <main className="grid min-h-screen place-items-center bg-[#0b0d12] text-white/50">Loading payment request…</main>

  const expired = payment.status === 'expired'
  return <main className="min-h-screen bg-[#0b0d12] px-6 py-8 text-white"><div className="mx-auto max-w-xl">
    <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50"><ArrowLeft data-icon="inline-start" /> ThorPay</Link>
    <section className="mt-12 rounded-3xl border border-white/10 bg-[#151820] p-7 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between"><span className="text-xs tracking-widest text-white/40">PAYMENT REQUEST</span><span className={`rounded-full px-3 py-1 text-xs ${expired ? 'bg-red-400/10 text-red-300' : 'bg-[#a6e96b]/10 text-[#a6e96b]'}`}>{expired ? 'EXPIRED' : 'ACTIVE'}</span></div>
      <p className="mt-10 text-sm text-white/45">{payment.recipient_name || 'Someone'} is requesting</p>
      <h1 className="mt-2 text-5xl font-semibold tracking-tight">{payment.amount} <span className="text-2xl text-white/45">{payment.asset}</span></h1>
      {payment.description && <p className="mt-4 text-white/60">{payment.description}</p>}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#a6e96b]/15 bg-[#a6e96b]/5 p-4"><ShieldCheck className="mt-0.5 text-[#a6e96b]" /><div><p className="text-sm font-medium">Recipient address protected</p><p className="mt-1 text-xs leading-5 text-white/45">The recipient&apos;s wallet address is kept private. ThorPay routes the payment directly to it.</p></div></div>
      {!expired && <><h2 className="mt-8 text-lg font-medium">Choose how you want to pay</h2><p className="mt-2 text-sm text-white/45">Choose a supported asset. Quotes refresh automatically before you pay.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{paymentAssets.map((asset) => <button type="button" key={asset} onClick={() => setSelectedAsset(asset)} className={`rounded-2xl border px-4 py-4 text-left transition ${selectedAsset === asset ? 'border-[#a6e96b] bg-[#a6e96b]/10' : 'border-white/10 bg-white/[.03] hover:border-[#a6e96b]/50'}`}><span className="flex items-center justify-between text-sm font-medium">{asset}{selectedAsset === asset && <Check className="text-[#a6e96b]" />}</span><span className="mt-1 block text-xs text-white/35">Pay with {asset}</span></button>)}</div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-center justify-between text-sm"><span className="text-white/50">You pay</span><span className="font-medium">{loadingQuote ? 'Refreshing quote…' : quote?.inputAmount ? `${quote.inputAmount} ${selectedAsset}` : 'Select an asset'}</span></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-white/50">You receive</span><span className="font-medium text-[#a6e96b]">{payment.amount} {payment.asset}</span></div><p className="mt-4 text-xs text-white/35">{quote?.route ? `Route: ${quote.route}` : 'Powered by the existing THORChain SDK quote flow.'}</p></div>
        <Link href={`/?mode=memoless&to=${encodeURIComponent(payment.asset)}&chain=${encodeURIComponent(payment.chain)}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3.5 text-sm font-medium hover:border-[#a6e96b]/60"><WalletCards data-icon="inline-start" /> Pay without connecting a wallet</Link>
        <button type="button" onClick={copyLink} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#a6e96b] px-5 py-3.5 font-medium text-[#10130d]">{copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />} {copied ? 'Link copied' : 'Copy payment link'}</button>
      </>}
      {expired && <div className="mt-6 rounded-2xl bg-red-400/10 p-4 text-sm text-red-200">This request is no longer accepting payments.</div>}
    </section>
    <p className="mt-6 text-center text-xs text-white/30">Powered by THORChain · Non-custodial payments</p>
  </div></main>
}
