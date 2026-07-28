import { RELIABILITY_LABEL, RELIABILITY_TONE, RELIABILITY_DESCRIPTION, type Reliability } from '@/lib/reliability';
import {
  CheckCircleIcon,
  LinkIcon,
  GaugeIcon,
  ShuffleIcon,
  MinusCircleIcon,
} from '@/components/icons';

const TONE_CLASS: Record<string, string> = {
  up: 'tone-up',
  teal: 'tone-teal',
  violet: 'tone-violet',
  amber: 'tone-amber',
  muted: 'tone-muted',
};

/**
 * Nunca comunicar confiabilidade só por cor (anti-padrão "Color Only" —
 * ver skill ui-ux-pro-max, domínio ux/accessibility). Cada selo carrega
 * ícone + texto além da cor.
 */
const TONE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  up: CheckCircleIcon,
  teal: LinkIcon,
  violet: GaugeIcon,
  amber: ShuffleIcon,
  muted: MinusCircleIcon,
};

export function ReliabilityBadge({ reliability, title }: { reliability: Reliability; title?: string }) {
  const tone = RELIABILITY_TONE[reliability];
  const Icon = TONE_ICON[tone];
  return (
    <span className={`badge ${TONE_CLASS[tone]}`} title={title ?? RELIABILITY_DESCRIPTION[reliability]}>
      <Icon />
      {RELIABILITY_LABEL[reliability]}
    </span>
  );
}
