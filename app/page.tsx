import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { AlertIcon } from '@/components/icons';
import { getGoogleAdsSummary } from '@/lib/data/google-ads';
import { getMetaAdsSummary } from '@/lib/data/meta-ads';
import { getGa4Summary } from '@/lib/data/ga4';
import { getWakeOrdersSummary } from '@/lib/data/wake-commerce';
import { formatCurrency, formatInt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const [googleAds, metaAds, ga4, wakeOrders] = await Promise.all([
    getGoogleAdsSummary(),
    getMetaAdsSummary(),
    getGa4Summary(),
    getWakeOrdersSummary(),
  ]);

  const totalInvestment =
    (googleAds.status === 'ok' ? googleAds.data.cost : 0) + (metaAds.status === 'ok' ? metaAds.data.cost : 0);
  const hasInvestment = googleAds.status === 'ok' || metaAds.status === 'ok';

  const mer =
    hasInvestment && totalInvestment > 0 && wakeOrders.status === 'ok'
      ? wakeOrders.data.revenueCaptured / totalInvestment
      : null;

  return (
    <>
      <PageHeader title="Overview geral" subtitle="Sumirê Perfumaria — visão cruzada: mídia paga, GA4 e e-commerce" />

      <div className="notice">
        <AlertIcon />
        <div>
          Esta aba conecta <b>investimento (Meta Ads + Google Ads)</b>, <b>comportamento (GA4)</b> e{' '}
          <b>resultado (Wake Commerce)</b> num único painel. Detalhamento por fonte fica nas abas Mídia paga, SEO e
          Ecommerce.
        </div>
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Indicadores cruzados
        </h2>
        <span className="hint">últimos 7 dias</span>
      </div>
      <div className="kpi-grid">
        <KpiCard
          label="Investimento total"
          value={formatCurrency(totalInvestment)}
          source="Meta + Google"
          status="Mídia paga — soma das duas plataformas"
        />
        <KpiCard
          tone="teal"
          label="Sessões"
          value={ga4.status === 'ok' ? formatInt(ga4.data.sessions) : '—'}
          source="GA4"
          status={ga4.status === 'ok' ? undefined : ga4.reason}
        />
        <KpiCard
          tone="violet"
          label="Pedidos válidos"
          value={wakeOrders.status === 'ok' ? formatInt(wakeOrders.data.ordersValid) : '—'}
          source="Wake Commerce"
          status={wakeOrders.status === 'ok' ? undefined : wakeOrders.reason}
        />
        <KpiCard
          tone="amber"
          label="Receita captada"
          value={wakeOrders.status === 'ok' ? formatCurrency(wakeOrders.data.revenueCaptured) : '—'}
          source="Wake Commerce"
        />
        <KpiCard
          label="MER"
          value={mer !== null ? mer.toFixed(2).replace('.', ',') : '—'}
          source="Reconciliada"
          status="Receita captada (Wake) ÷ investimento total"
        />
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Por fonte
        </h2>
      </div>
      <div className="acct-grid">
        <Link href="/midia-paga" className="card panel source-card" style={{ display: 'block' }}>
          <div className="panel-head">
            <div>
              <h3>Mídia paga</h3>
              <p>Meta Ads + Google Ads</p>
            </div>
          </div>
          <div className="kpi-sub" style={{ marginTop: 10 }}>
            <ReliabilityBadge reliability={googleAds.reliability} title="Google Ads" />
            <ReliabilityBadge reliability={metaAds.reliability} title="Meta Ads" />
          </div>
        </Link>

        <Link href="/seo" className="card panel source-card t-teal" style={{ display: 'block' }}>
          <div className="panel-head">
            <div>
              <h3>SEO</h3>
              <p>GA4 — tráfego orgânico</p>
            </div>
          </div>
          <div className="kpi-sub" style={{ marginTop: 10 }}>
            <ReliabilityBadge reliability={ga4.reliability} />
          </div>
        </Link>

        <Link href="/ecommerce" className="card panel source-card t-violet" style={{ display: 'block' }}>
          <div className="panel-head">
            <div>
              <h3>Ecommerce</h3>
              <p>Wake Commerce — pedidos e receita</p>
            </div>
          </div>
          <div className="kpi-sub" style={{ marginTop: 10 }}>
            <ReliabilityBadge reliability={wakeOrders.reliability} />
          </div>
        </Link>

        <Link href="/organico" className="card panel source-card t-amber" style={{ display: 'block' }}>
          <div className="panel-head">
            <div>
              <h3>Orgânico</h3>
              <p>Instagram &amp; TikTok — 4 contas</p>
            </div>
          </div>
          <div className="kpi-sub" style={{ marginTop: 10 }}>
            <ReliabilityBadge reliability="real" title="Perfumaria · Instagram" />
          </div>
        </Link>
      </div>
    </>
  );
}
