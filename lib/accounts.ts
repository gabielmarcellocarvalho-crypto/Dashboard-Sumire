export type AccountSlug = 'perfumaria-instagram' | 'perfumaria-tiktok' | 'exclusivos-instagram' | 'exclusivos-tiktok';

export interface AccountConfig {
  slug: AccountSlug;
  brand: 'Sumirê Perfumaria' | 'Sumirê Exclusivos';
  platform: 'Instagram' | 'TikTok';
  handle: string;
  accountIdEnv: string;
}

export const ACCOUNTS: Record<AccountSlug, AccountConfig> = {
  'perfumaria-instagram': {
    slug: 'perfumaria-instagram',
    brand: 'Sumirê Perfumaria',
    platform: 'Instagram',
    handle: '@perfumariasumire',
    accountIdEnv: 'WINDSOR_IG_SUMIRE_PERFUMARIA_ACCOUNT_ID',
  },
  'perfumaria-tiktok': {
    slug: 'perfumaria-tiktok',
    brand: 'Sumirê Perfumaria',
    platform: 'TikTok',
    handle: '@perfumariasumire',
    accountIdEnv: 'WINDSOR_TIKTOK_SUMIRE_PERFUMARIA_ACCOUNT_ID',
  },
  'exclusivos-instagram': {
    slug: 'exclusivos-instagram',
    brand: 'Sumirê Exclusivos',
    platform: 'Instagram',
    handle: '@exclusivossumire',
    accountIdEnv: 'WINDSOR_IG_SUMIRE_EXCLUSIVOS_ACCOUNT_ID',
  },
  'exclusivos-tiktok': {
    slug: 'exclusivos-tiktok',
    brand: 'Sumirê Exclusivos',
    platform: 'TikTok',
    handle: '@exclusivossumire',
    accountIdEnv: 'WINDSOR_TIKTOK_SUMIRE_EXCLUSIVOS_ACCOUNT_ID',
  },
};

export const ACCOUNT_ORDER: AccountSlug[] = [
  'perfumaria-instagram',
  'perfumaria-tiktok',
  'exclusivos-instagram',
  'exclusivos-tiktok',
];

export function isConfigured(slug: AccountSlug): boolean {
  const acc = ACCOUNTS[slug];
  if (acc.platform === 'TikTok') return false; // roteamento do TikTok ainda não confirmado, independente de env
  return Boolean(process.env.WINDSOR_AI_API_KEY?.trim() && process.env[acc.accountIdEnv]?.trim());
}
