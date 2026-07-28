import { KpiGridSkeleton, PanelSkeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <>
      <KpiGridSkeleton count={3} />
      <div className="grid-2" style={{ marginTop: 14 }}>
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
      <div style={{ marginTop: 12 }}>
        <PanelSkeleton />
      </div>
    </>
  );
}
