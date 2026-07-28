import Link from 'next/link';
import { KpiCard } from '@/components/kpi-card';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { EmptyState } from '@/components/empty-state';
import { ReachAreaChart } from '@/components/charts/reach-area-chart';
import { InstagramIcon, TiktokIcon, AlertIcon } from '@/components/icons';
import { getInstagramSummary } from '@/lib/data/windsor';
import { formatInt, formatPercent } from '@/lib/format';
import { ACCOUNTS, ACCOUNT_ORDER, isConfigured } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

export default async function OrganicoOverviewPage() {
  const perfumariaIg = await getInstagramSummary(
    process.env.WINDSOR_IG_SUMIRE_PERFUMARIA_ACCOUNT_ID,
    ACCOUNTS['perfumaria-instagram'].brand,
  );

  const engagementRate =
    perfumariaIg.status === 'ok' && perfumariaIg.data.totals.reach > 0
      ? (perfumariaIg.data.totals.mediaEngagement / perfumariaIg.data.totals.reach) * 100
      : null;

  return (
    <>
      <div className="notice">
        <AlertIcon />
        <div>
          <b>Sumirê Perfumaria · Instagram</b> usa dados reais (Windsor.ai, últimos 7 dias). As demais 3 contas
          ainda não têm credencial configurada — aparecem como <b>Indisponível</b>, em vez de números fictícios.
        </div>
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Sumirê Perfumaria · Instagram
        </h2>
        <span className="hint">últimos 7 dias</span>
      </div>

      {perfumariaIg.status === 'ok' ? (
        <div className="kpi-grid">
          <KpiCard
            label="Seguidores totais"
            value={formatInt(perfumariaIg.data.totalFollowers)}
            source="Windsor.ai"
            delta={{ value: `+${formatInt(perfumariaIg.data.totals.newFollowers)}`, direction: 'up' }}
            meta="no período"
          />
          <KpiCard
            tone="teal"
            label="Alcance"
            value={formatInt(perfumariaIg.data.totals.reach)}
            source="Windsor.ai"
            status="Contas alcançadas · soma do período"
          />
          <KpiCard
            tone="violet"
            label="Visualizações de vídeo"
            value={formatInt(perfumariaIg.data.totals.views)}
            source="Windsor.ai"
            status="Reels"
          />
          <KpiCard
            label="Engajamento total"
            value={formatInt(perfumariaIg.data.totals.mediaEngagement)}
            source="Windsor.ai"
            status="Curtidas + coment. + salvamentos (campo Windsor)"
          />
          <KpiCard
            tone="teal"
            label="Taxa de engajamento"
            value={engagementRate !== null ? formatPercent(engagementRate) : '—'}
            source="Calculado"
            status="Engajamento ÷ alcance"
          />
        </div>
      ) : (
        <div className="card">
          <EmptyState title="Instagram Perfumaria indisponível" reason={perfumariaIg.reason} />
        </div>
      )}

      {perfumariaIg.status === 'ok' && perfumariaIg.data.daily.length > 1 && (
        <>
          <div className="section-head">
            <h2>
              <span className="tick" />
              Alcance diário
            </h2>
            <span className="hint">
              {perfumariaIg.data.periodStart} – {perfumariaIg.data.periodEnd}
            </span>
          </div>
          <div className="card panel">
            <div className="panel-head">
              <div>
                <h3>Alcance diário · Instagram Perfumaria</h3>
                <p>Windsor.ai, consolidado por dia</p>
              </div>
              <ReliabilityBadge reliability="real" />
            </div>
            <ReachAreaChart data={perfumariaIg.data.daily as unknown as Record<string, unknown>[]} color="#EC2E82" />
          </div>
        </>
      )}

      <div className="section-head">
        <h2>
          <span className="tick" />
          Contas
        </h2>
        <span className="hint">4 contas · Instagram &amp; TikTok</span>
      </div>
      <div className="acct-grid">
        {ACCOUNT_ORDER.map((slug) => {
          const acc = ACCOUNTS[slug];
          const configured = isConfigured(slug);
          const isPerfumariaIg = slug === 'perfumaria-instagram';
          const href = `/organico/${acc.brand === 'Sumirê Perfumaria' ? 'perfumaria' : 'exclusivos'}/${acc.platform.toLowerCase()}`;
          return (
            <Link href={href} className="card acct-card" key={slug} style={{ display: 'block' }}>
              <div className="acct-head">
                <div className={`acct-plat ${acc.platform === 'Instagram' ? 'ig' : 'tt'}`}>
                  {acc.platform === 'Instagram' ? <InstagramIcon /> : <TiktokIcon />}
                </div>
                <div>
                  <div className="nm">{acc.brand}</div>
                  <div className="hd">
                    {acc.platform} · {acc.handle}
                  </div>
                </div>
                <ReliabilityBadge reliability={configured ? 'real' : 'indisponivel'} />
              </div>

              {isPerfumariaIg && perfumariaIg.status === 'ok' ? (
                <>
                  <div className="acct-followers">
                    <span className="big tnum">{formatInt(perfumariaIg.data.totalFollowers)}</span>
                    <span className="lbl">seguidores</span>
                  </div>
                  <div className="acct-metrics">
                    <div className="m">
                      <div className="v tnum">{formatInt(perfumariaIg.data.totals.reach)}</div>
                      <div className="k">Alcance</div>
                    </div>
                    <div className="m">
                      <div className="v tnum">{formatInt(perfumariaIg.data.totals.views)}</div>
                      <div className="k">Views de vídeo</div>
                    </div>
                    <div className="m">
                      <div className="v tnum">{formatInt(perfumariaIg.data.totals.mediaEngagement)}</div>
                      <div className="k">Engajamento</div>
                    </div>
                    <div className="m">
                      <div className="v na">indisponível</div>
                      <div className="k">Publicações</div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Sem credencial configurada"
                  reason={
                    acc.platform === 'TikTok'
                      ? 'Roteamento do TikTok (Windsor.ai vs. API direta) ainda não confirmado pelo operador.'
                      : `Faltam ${acc.accountIdEnv} em .env.local.`
                  }
                />
              )}
            </Link>
          );
        })}
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Análises
        </h2>
      </div>
      <div className="grid-2b">
        <Link href="/organico/comparativo" className="card panel source-card" style={{ display: 'block' }}>
          <h3>Comparativo mensal (MoM)</h3>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Este mês vs. mês anterior</p>
        </Link>
        <Link href="/organico/top-conteudos" className="card panel source-card t-amber" style={{ display: 'block' }}>
          <h3>Top conteúdos</h3>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Melhores publicações do período</p>
        </Link>
      </div>
    </>
  );
}
