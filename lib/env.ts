/**
 * Verifica quais integrações têm credenciais configuradas em .env.local.
 * Usado pelas camadas de dados pra decidir entre chamada real e estado
 * "indisponível" — nunca inventar dado quando a credencial não existe.
 */

function has(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

export const integrations = {
  windsor: has('WINDSOR_AI_API_KEY'),
  windsorIgPerfumaria: has('WINDSOR_AI_API_KEY', 'WINDSOR_IG_SUMIRE_PERFUMARIA_ACCOUNT_ID'),
  windsorIgExclusivos: has('WINDSOR_AI_API_KEY', 'WINDSOR_IG_SUMIRE_EXCLUSIVOS_ACCOUNT_ID'),
  windsorTiktokPerfumaria: has('WINDSOR_AI_API_KEY', 'WINDSOR_TIKTOK_SUMIRE_PERFUMARIA_ACCOUNT_ID'),
  windsorTiktokExclusivos: has('WINDSOR_AI_API_KEY', 'WINDSOR_TIKTOK_SUMIRE_EXCLUSIVOS_ACCOUNT_ID'),

  ga4: has('GA4_SERVICE_ACCOUNT_CLIENT_EMAIL', 'GA4_SERVICE_ACCOUNT_PRIVATE_KEY', 'GA4_SUMIRE_PERFUMARIA_PROPERTY_ID'),
  searchConsole: has('GSC_CLIENT_ID', 'GSC_CLIENT_SECRET', 'GSC_REFRESH_TOKEN', 'GSC_SITE_URL'),

  googleAds: has(
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_SUMIRE_PERFUMARIA_CUSTOMER_ID',
  ),

  metaAds: has('META_ADS_ACCESS_TOKEN', 'META_ADS_SUMIRE_PERFUMARIA_ACCOUNT_ID'),

  wakeCommerce: has('WAKE_COMMERCE_API_URL', 'WAKE_COMMERCE_API_KEY'),
  wakeCrm: has('WAKE_CRM_API_URL', 'WAKE_CRM_API_KEY'),
} as const;

export type IntegrationKey = keyof typeof integrations;

/**
 * Visibilidade das seções de navegação (briefing v3, seção 8): "páginas
 * ainda sem dados reais não devem aparecer como telas vazias na versão
 * apresentada ao cliente". `showBetaSections` (`SHOW_BETA_SECTIONS=true`)
 * força tudo visível pra uso interno/QA.
 */
const showBetaSections = process.env.SHOW_BETA_SECTIONS === 'true';

export const navVisibility = {
  midiaPaga: showBetaSections || integrations.googleAds || integrations.metaAds,
  seo: showBetaSections || integrations.ga4 || integrations.searchConsole,
  ecommerce: showBetaSections || integrations.wakeCommerce || integrations.wakeCrm,
  organico:
    showBetaSections ||
    integrations.windsorIgPerfumaria ||
    integrations.windsorIgExclusivos ||
    integrations.windsorTiktokPerfumaria ||
    integrations.windsorTiktokExclusivos,
} as const;
