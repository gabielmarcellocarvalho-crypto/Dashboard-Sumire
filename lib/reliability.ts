/**
 * Classificação de confiabilidade dos dados exibidos no dashboard.
 *
 * "real"/"demo"/"estimado" cobrem o bloco orgânico (protótipo original).
 * "oficial"/"reconciliada"/"diagnostica"/"proxy"/"indisponivel" seguem a
 * classificação formal do briefing técnico v2.0 (docs/briefing-dashboard-v2.md,
 * seção 5) para mídia paga e e-commerce.
 *
 * Nunca renderizar um valor "indisponivel" como zero — sempre mostrar o
 * selo e uma explicação do motivo (ver `IndisponivelReason`).
 */
export type Reliability =
  | 'real'
  | 'demo'
  | 'estimado'
  | 'oficial'
  | 'reconciliada'
  | 'diagnostica'
  | 'proxy'
  | 'indisponivel';

export const RELIABILITY_LABEL: Record<Reliability, string> = {
  real: 'Real',
  demo: 'Exemplo',
  estimado: 'Estimado',
  oficial: 'Oficial',
  reconciliada: 'Reconciliada',
  diagnostica: 'Diagnóstica',
  proxy: 'Proxy',
  indisponivel: 'Indisponível',
};

export const RELIABILITY_DESCRIPTION: Record<Reliability, string> = {
  real: 'Dado real, extraído diretamente da fonte.',
  demo: 'Dado de exemplo (ordem de grandeza plausível) — credencial ainda não configurada.',
  estimado: 'Valor estimado/calculado a partir de outros campos, não vem direto da fonte.',
  oficial: 'Extraído diretamente da fonte considerada oficial para esta informação.',
  reconciliada: 'Métrica criada pelo cruzamento entre duas ou mais fontes.',
  diagnostica: 'Útil para otimização de mídia, mas não representa o resultado financeiro consolidado.',
  proxy: 'Métrica temporária usada pela indisponibilidade do dado ideal — marcada explicitamente.',
  indisponivel: 'Não pode ser calculada com confiabilidade nas fontes hoje configuradas.',
};

/** Tom visual reaproveitando os tokens de cor já travados no sistema de design. */
export const RELIABILITY_TONE: Record<Reliability, 'up' | 'teal' | 'violet' | 'amber' | 'muted'> = {
  real: 'up',
  oficial: 'up',
  reconciliada: 'teal',
  diagnostica: 'violet',
  demo: 'amber',
  proxy: 'amber',
  estimado: 'muted',
  indisponivel: 'muted',
};
