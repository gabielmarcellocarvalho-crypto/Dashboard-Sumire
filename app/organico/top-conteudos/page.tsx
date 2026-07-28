import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { ReliabilityBadge } from '@/components/reliability-badge';

export default function TopConteudosPage() {
  return (
    <>
      <PageHeader title="Top conteúdos" subtitle="Melhores publicações por alcance ou engajamento no período" />

      <div className="card">
        <EmptyState
          title="Indisponível com a coleta atual"
          reason='Os 19 campos coletados hoje via Windsor.ai (ver scripts/fetch-windsor-instagram.js) são agregados por conta/data — não incluem identificador de post, legenda ou métricas por publicação. Pra listar "top conteúdos" é preciso pedir ao conector campos de nível de mídia (ex.: media_id, caption, permalink, thumbnail) ou usar a Meta Graph API diretamente nesse ponto.'
        />
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Classificação
        </h2>
      </div>
      <div className="card panel" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ReliabilityBadge reliability="indisponivel" />
        <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
          Marcado como indisponível em vez de mostrar uma lista vazia ou inventada — ver docs/metricas.md.
        </span>
      </div>
    </>
  );
}
