import { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import { useIsPrivateSend, usePrivateSwapAcknowledged, useSetPrivateSwapAcknowledged } from '@/store/private-swap-store'

const externalLink = (href: string) => (chunks: ReactNode) => (
  <a className="underline" href={href} rel="noopener noreferrer" target="_blank">
    {chunks}
  </a>
)

// `send` overrides the swap form's mode, for the wallet Send dialog's Private Send tab.
export const SwapPrivateDisclaimer = ({ send }: { send?: boolean }) => {
  const t = useTranslations('swap.private')
  const acknowledged = usePrivateSwapAcknowledged()
  const setAcknowledged = useSetPrivateSwapAcknowledged()
  const isPrivateSend = useIsPrivateSend()
  const isSend = send ?? isPrivateSend

  return (
    <div className="rounded-15 text-txt-label-small space-y-2 border p-5 text-sm">
      <p>
        {t.rich(isSend ? 'disclaimerSend' : 'disclaimer', {
          link: externalLink('https://docs.houdiniswap.com/overview/swaps-and-transfers/private-swaps')
        })}
      </p>
      <label className="flex cursor-pointer items-center gap-3 pt-1">
        <Checkbox className="size-5" checked={acknowledged} onCheckedChange={checked => setAcknowledged(checked === true)} />
        <span className="text-txt-high-contrast">
          {t.rich('acknowledge', {
            link: externalLink(
              'https://cdn.prod.website-files.com/69143df941a2491956546ef7/6a579a7d3db98c279dc6020b_Houdini%20Swap%20-%20Terms%20of%20Service-14673161-v6.pdf'
            )
          })}
        </span>
      </label>
    </div>
  )
}
