import { KpiGridSkeleton, PanelSkeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <>
      <KpiGridSkeleton count={3} />
      <div style={{ marginTop: 14 }}>
        <PanelSkeleton />
      </div>
      <KpiGridSkeleton count={3} />
    </>
  );
}
