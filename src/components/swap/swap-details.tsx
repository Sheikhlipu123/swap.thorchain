import { USwapNumber } from '@tcswap/core'
import { Icon } from '@/components/icons'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo } from '@/hooks/use-swap'
import { formatExpiration } from '@/lib/swap-helpers'
import { cn } from '@/lib/utils'
import { useIsPrivateSend } from '@/store/limit-swap-store'

export function SwapDetails() {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { quote } = useQuote()
  // A send's "1 BTC = 0.98 BTC" reads as a loss, not a rate; Recipient Gets already shows the payout.
  const isPrivateSend = useIsPrivateSend()

  const estimatedTime = quote?.estimatedTime

  if (!assetFrom || !assetTo || !quote) return null

  // Add buy-asset fees back to the expected output to get the pool price
  const buyAssetFees = quote.fees.filter(fee => fee.asset.toUpperCase() === quote.buyAsset.toUpperCase()).map(fee => fee.amount)
  const totalBuyAmount = new USwapNumber(quote.expectedBuyAmount).add(...buyAssetFees)
  const price = totalBuyAmount.div(quote.sellAmount)

  return (
    <div className={cn('text-txt-high-contrast flex justify-between text-[13px] font-semibold', { 'pt-2': isPrivateSend })}>
      {!isPrivateSend && (
        <span className="p-4 pb-2">
          1 {assetFrom.ticker} = {price.toSignificant()} {assetTo.ticker}
        </span>
      )}

      <div className="ml-auto flex items-center px-4">
        {estimatedTime && estimatedTime.total > 0 && (
          <div
            className={cn('text-txt-high-contrast flex h-8 items-center', {
              'bg-jacob/10 text-jacob rounded-full p-2': estimatedTime.total > 3600
            })}
          >
            <Icon width={16} height={16} viewBox="0 0 16 16" name="clock-filled" />
            <span className="ms-1 text-xs">{formatExpiration(estimatedTime.total)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
