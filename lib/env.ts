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
