export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="kpi-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card kpi">
          <div className="skel skel-line" style={{ width: '50%', height: 9 }} />
          <div className="skel skel-line" style={{ width: '70%', height: 22, marginTop: 6 }} />
          <div className="skel skel-line" style={{ width: '85%', height: 9, marginBottom: 0 }} />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="card panel">
      <div className="skel skel-line" style={{ width: '30%', height: 12 }} />
      <div className="skel skel-panel" style={{ marginTop: 12 }} />
    </div>
  );
}

export function PageSkeleton({ panels = 1 }: { panels?: number }) {
  return (
    <>
      <div className="skel skel-line" style={{ width: 220, height: 26, marginBottom: 28 }} />
      <KpiGridSkeleton />
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: panels }).map((_, i) => (
          <PanelSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
