import { MinusCircleIcon } from '@/components/icons';

export function EmptyState({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="empty-state">
      <MinusCircleIcon />
      <b>{title}</b>
      <p>{reason}</p>
    </div>
  );
}
