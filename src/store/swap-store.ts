import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Asset } from '@/components/swap/asset'
import { isPrivateSendMode, useLimitSwapStore } from '@/store/limit-swap-store'

const INITIAL_AMOUNT_FROM = 1

const isSending = () => isPrivateSendMode(useLimitSwapStore.getState())

// On the PRIVATE tab picking the other side's asset switches Send on instead of flipping. Pickers
// only: the URL and tab-switch code pass through momentary same-asset pairs.
export const startPrivateSendOnSamePick = (picked: Asset, side: 'from' | 'to') => {
  const { isPrivateSwap, setIsPrivateSend } = useLimitSwapStore.getState()
  const { assetFrom, assetTo } = useSwapStore.getState()
  const other = side === 'from' ? assetTo : assetFrom
  if (isPrivateSwap && picked.identifier === other?.identifier) setIsPrivateSend(true)
}

export const INITIAL_SLIPPAGE = 1
export const INITIAL_CUSTOM_INTERVAL = 0
export const INITIAL_CUSTOM_QUANTITY = 0

interface SwapState {
  assetFrom?: Asset
  assetTo?: Asset
  amountFrom: string
  slippage?: number
  customInterval: number
  customQuantity: number
  feeWarning: string
  hasHydrated: boolean

  setSlippage: (limit?: number) => void
  setCustomInterval: (interval: number) => void
  setCustomQuantity: (quantity: number) => void
  setAmountFrom: (amount: string) => void
  setAssetFrom: (asset: Asset) => void
  setAssetTo: (asset: Asset) => void
  swapAssets: (amount?: string) => void
  setHasHydrated: (state: boolean) => void
}

export const useSwapStore = create<SwapState>()(
  persist(
    (set, get) => ({
      slippage: INITIAL_SLIPPAGE,
      customInterval: INITIAL_CUSTOM_INTERVAL,
      customQuantity: INITIAL_CUSTOM_QUANTITY,
      amountFrom: INITIAL_AMOUNT_FROM.toString(),
      feeWarning: '500',
      hasHydrated: false,

      setSlippage: slippage => set({ slippage: slippage }),
      setCustomInterval: customInterval => set({ customInterval }),
      setCustomQuantity: customQuantity => set({ customQuantity }),
      setAmountFrom: fromAmount => set({ amountFrom: fromAmount }),

      setAssetFrom: asset => {
        const { assetFrom, assetTo } = get()
        if (isSending()) return set({ assetFrom: asset, assetTo: asset })

        set({
          assetFrom: asset,
          assetTo: assetTo?.identifier === asset.identifier ? assetFrom : assetTo
        })
      },

      setAssetTo: asset => {
        const { assetFrom, assetTo } = get()
        if (isSending()) return set({ assetFrom: asset, assetTo: asset })

        set({
          assetFrom: assetFrom?.identifier === asset.identifier ? assetTo : assetFrom,
          assetTo: asset
        })
      },

      swapAssets: (amount?: string) => {
        const { assetFrom, assetTo } = get()

        set({
          assetFrom: assetTo,
          assetTo: assetFrom,
          amountFrom: amount || ''
        })
      },

      setHasHydrated: (state: boolean) => set({ hasHydrated: state })
    }),
    {
      name: 'tc-swap-store',
      version: 3,
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true)
      },
      partialize: state => ({
        slippage: state.slippage,
        feeWarning: state.feeWarning,
        assetFrom: state.assetFrom,
        assetTo: state.assetTo
      })
    }
  )
)
