import { ArrowUpIcon, ArrowDownIcon } from '@/components/icons';

type Tone = 'up' | 'teal' | 'violet' | 'amber' | 'muted';

const toneClass = (tone?: Tone) => (tone ? ` t-${tone}` : '');

export function KpiCard({
  label,
  value,
  tone,
  source,
  delta,
  meta,
  status,
  sub,
}: {
  label: string;
  value: string;
  tone?: Tone;
  /** Tag pequena no canto (ex.: "Windsor.ai", "GA4", "Calculado") — de onde o número vem. */
  source?: string;
  delta?: { value: string; direction: 'up' | 'down' };
  /** Texto à direita do delta (ex.: comparação com meta). */
  meta?: string;
  /** Linha inferior com ponto colorido + explicação (ex.: fórmula, classificação). */
  status?: string;
  /** Fallback simples quando não há delta/meta/status — lista de observações curtas. */
  sub?: React.ReactNode;
}) {
  return (
    <div className={`card kpi${toneClass(tone)}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {source && <span className="kpi-src">{source}</span>}
      </div>
      <div className="kpi-value tnum">{value}</div>

      {(delta || meta) && (
        <div className="kpi-bot">
          {delta && (
            <span className={`delta ${delta.direction}`}>
              {delta.direction === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {delta.value}
            </span>
          )}
          {meta && <span className="kpi-meta">{meta}</span>}
        </div>
      )}

      {status && (
        <div className={`kpi-status${toneClass(tone)}`}>
          <span className="dot" />
          <span>{status}</span>
        </div>
      )}

      {!status && sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
