import { ProviderName } from '@tcswap/helpers'

export const AppConfig = {
  id: 'thorchain',
  appName: 'ThorPay',
  title: 'ThorPay | Get paid in crypto',
  description: 'Create one payment link and receive the asset you requested while your customer pays with another supported crypto asset.',
  baseUrl: 'https://thorpay.xyz',
  providers: [ProviderName.THORCHAIN, ProviderName.MAYACHAIN],
  // The PRIVATE tab quotes this provider alone; its assets are listed only there.
  privateProvider: ProviderName.HOUDINI,
  favicon: '/favicon.ico',
  logo: '/logo.svg',
  logoLink: 'https://www.thorchain.org',
  gtag: 'G-VZ0FQ1WC7G',
  pixelId: 'qki4a',
  pixelEvent: 'tw-qki4a-qop3i',
  affiliateLink: 'https://affiliate.thorchain.org',
  telegramLink: 'https://t.me/thorchain_org',
  privacyPolicyLink: 'https://www.thorchain.org/privacy-policy',
  tosLink: 'https://www.thorchain.org/terms-of-use',
  supportEmail: 'contact@thorchain.org'
}

export const PRIMARY_HOST = 'swap.thorchain.org'

export const SUBDOMAIN_ROUTES = [
  { path: '/tcy', host: 'tcy.thorchain.org' },
  { path: '/bond', host: 'bond.thorchain.org' },
  { path: '/memo', host: 'memo.thorchain.org' },
  { path: '/pool', host: 'pool.thorchain.org' },
  { path: '/thorname', host: 'thorname.thorchain.org' },
  { path: '/affiliate', host: 'affiliate.thorchain.org' }
] as const
