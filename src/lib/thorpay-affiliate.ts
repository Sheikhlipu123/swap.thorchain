export type ThorPayAffiliateConfig = {
  enabled: boolean
  thorname?: string
  bps: number
}

export function getAffiliateConfig(): ThorPayAffiliateConfig {
  const bps = Number(process.env.THORPAY_AFFILIATE_BPS ?? 0)
  const thorname = process.env.THORPAY_AFFILIATE_THORNAME?.trim() || undefined
  return { enabled: Boolean(thorname && Number.isInteger(bps) && bps > 0), thorname, bps: Number.isInteger(bps) && bps > 0 ? bps : 0 }
}
