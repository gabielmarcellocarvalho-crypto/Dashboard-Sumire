/**
 * Ícones genéricos vêm do lucide-react (mesmo pacote usado no componente de
 * referência trazido pelo operador). Tamanho/stroke-width são controlados
 * via CSS (seletores descendentes tipo `.nav-item svg`), não aqui — por
 * isso os componentes abaixo são só re-exports diretos, sem wrapper.
 *
 * Instagram/TikTok NÃO têm ícone correspondente no lucide (é um set
 * genérico, sem logos de marca) — mantidos como SVG próprio.
 */
export {
  LayoutGrid as GridIcon,
  BarChart3 as BarsIcon,
  Target as TargetIcon,
  Menu as MenuIcon,
  Calendar as CalendarIcon,
  CircleAlert as AlertIcon,
  Users as UsersIcon,
  Eye as EyeIcon,
  PlayCircle as PlayIcon,
  Heart as HeartIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  CircleCheck as CheckCircleIcon,
  Link2 as LinkIcon,
  Gauge as GaugeIcon,
  Shuffle as ShuffleIcon,
  CircleMinus as MinusCircleIcon,
  DollarSign as DollarIcon,
  ShoppingCart as CartIcon,
  Mail as MailIcon,
  Building2 as BuildingIcon,
  Box as BoxIcon,
  Search as SearchIcon,
  Megaphone as MegaphoneIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  RefreshCw as RefreshIcon,
  Flag as FlagIcon,
  ShieldCheck as ShieldCheckIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from 'lucide-react';

type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 3v11.6a3 3 0 1 1-3-3" />
      <path d="M9 7a6 6 0 0 0 6 5V8.6A4.6 4.6 0 0 1 12 4" />
    </svg>
  );
}
