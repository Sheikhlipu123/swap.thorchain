import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIsPrivateSend, useSetIsPrivateSend } from '@/store/private-swap-store'

export const SwapPrivateMode = () => {
  const t = useTranslations('swap.private')
  const isSend = useIsPrivateSend()
  const setIsSend = useSetIsPrivateSend()

  const option = (send: boolean, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={isSend === send}
      onClick={() => setIsSend(send)}
      className={cn(
        'cursor-pointer rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-200',
        isSend === send ? 'bg-modal text-txt-high-contrast border' : 'text-txt-label-small hover:text-txt-high-contrast border border-transparent'
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="flex items-center justify-between gap-3">
      <div role="tablist" className="bg-swap-bloc flex items-center rounded-full border p-1">
        {option(false, t('modeSwap'))}
        {option(true, t('modeSend'))}
      </div>
      <span className="text-txt-label-small truncate pr-2 text-xs font-medium">{isSend ? t('modeSendHint') : t('modeSwapHint')}</span>
    </div>
  )
}
