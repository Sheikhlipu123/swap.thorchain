'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Copy, ShieldCheck, WalletCards } from 'lucide-react'

type Payment = { public_id: string; recipient_name?: string; amount: string; asset: string; chain: string; description?: string; status: string; expires_at?: string }
type Quote = { expectedBuyAmount?: string; expectedBuyAmountDecimal?: string; expiry?: string; inboundAddress?: string; memo?: string }

const sourceAssets = ['BTC', 'ETH', 'USDT', 'RUNE']

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const [payment, setPayment] = useState<Payment>()
  const [sourceAsset, setSourceAsset] = useState('BTC')
  const [quote, setQuote] = useState<Quote>()
  const [quoteStatus, setQuoteStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [payWithoutWallet, setPayWithoutWallet] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    params.then(({ id }) => fetch(`/api/payments/${id}`).then(async response => {
      const data = await response.json()
      if (!response.ok || !data.payment) throw new Error(data.error ?? 'Payment not found')
      if (!active) return
      setPayment(data.payment)
      if (data.payment.status !== 'expired') {
        const quoteResponse = await fetch(`/api/payments/${id}/quote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceAsset: 'BTC', sourceAmount: data.payment.amount }) })
        const quoteData = await quoteResponse.json()
        if (active) {
          setQuote(quoteData.quote)
          setQuoteStatus(quoteResponse.ok ? 'ready' : 'error')
        }
      }
    }).catch(reason => active && setError(reason instanceof Error ? reason.message : 'Payment not found')))
    return () => { active = false }
  }, [params])

  const selectAsset = async (asset: string) => {
    if (!payment) return
    setSourceAsset(asset); setQuoteStatus('loading'); setQuote(undefined)
    const response = await fetch(`/api/payments/${payment.public_id}/quote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceAsset: asset, sourceAmount: payment.amount }) })
    const data = await response.json(); setQuote(data.quote); setQuoteStatus(response.ok ? 'ready' : 'error')
  }

  if (error) return <main className="grid min-h-screen place-items-center bg-[#0b0d12] px-6 text-white"><div className="text-center"><p className="text-xl">{error}</p><Link href="/" className="mt-5 inline-block text-sm text-[#a6e96b]">Return to ThorPay</Link></div></main>
  if (!payment) return <main className="grid min-h-screen place-items-center bg-[#0b0d12] text-white/50">Loading payment request and fresh quote…</main>
  const expired = payment.status === 'expired'

  return <main className="min-h-screen bg-[#0b0d12] px-6 py-8 text-white"><div className="mx-auto max-w-xl"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50"><ArrowLeft data-icon="inline-start" /> ThorPay</Link><section className="mt-12 rounded-3xl border border-white/10 bg-[#151820] p-7"><div className="flex items-center justify-between"><span className="text-xs tracking-widest text-white/40">PAYMENT REQUEST</span><span className={`rounded-full px-3 py-1 text-xs ${expired ? 'bg-red-400/10 text-red-300' : 'bg-[#a6e96b]/10 text-[#a6e96b]'}`}>{expired ? 'EXPIRED' : 'ACTIVE'}</span></div><p className="mt-10 text-sm text-white/45">{payment.recipient_name || 'Someone'} is requesting</p><h1 className="mt-2 text-5xl font-semibold tracking-tight">{payment.amount} <span className="text-2xl text-white/45">{payment.asset}</span></h1>{payment.description && <p className="mt-4 text-white/60">{payment.description}</p>}<div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/8 bg-black/15 p-4 text-sm text-white/55"><ShieldCheck className="text-[#a6e96b]" /> Recipient wallet details stay private and are only used by the swap service.</div>{expired ? <div className="mt-6 rounded-2xl bg-red-400/10 p-4 text-sm text-red-200">This request is no longer accepting payments.</div> : <><h2 className="mt-8 text-lg font-medium">Choose how you want to pay</h2><p className="mt-2 text-sm text-white/45">A fresh THORChain quote is fetched when this link opens and whenever you change assets.</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{sourceAssets.map(asset => <button type="button" key={asset} onClick={() => selectAsset(asset)} className={`rounded-2xl border px-4 py-4 text-left ${sourceAsset === asset ? 'border-[#a6e96b] bg-[#a6e96b]/10' : 'border-white/10 bg-white/[.03]'}`}><span className="block text-sm font-medium">{asset}</span><span className="mt-1 block text-xs text-white/35">Pay with {asset}</span></button>)}</div><div className="mt-6 rounded-2xl border border-white/8 bg-black/15 p-5"><div className="flex justify-between text-sm"><span className="text-white/45">You pay</span><span>{quoteStatus === 'loading' ? 'Refreshing quote…' : quote?.expectedBuyAmountDecimal || quote?.expectedBuyAmount || `${payment.amount} ${sourceAsset}`}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-white/45">You receive</span><span>{payment.amount} {payment.asset}</span></div>{quoteStatus === 'error' && <p className="mt-4 text-xs text-red-300">No live route is available for this asset right now.</p>}</div><button type="button" onClick={() => setPayWithoutWallet(true)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#a6e96b] px-5 py-3.5 font-medium text-[#10130e]"><WalletCards data-icon="inline-start" /> Pay without connecting a wallet</button>{payWithoutWallet && <div className="mt-4 rounded-2xl border border-[#a6e96b]/30 bg-[#a6e96b]/10 p-4 text-sm text-[#d9f8bc]">Instant payment mode uses ThorPay&apos;s existing memoless swap flow. No wallet connection is required; continue to get a deposit address for {sourceAsset}.</div>}</>}</section><p className="mt-5 text-center text-xs text-white/30">Powered by THORChain · <button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)} className="underline">Copy payment link</button></p></div></main>
}
