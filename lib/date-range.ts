/**
 * Camada global de período/comparação (briefing v3, seção 7 e 22.1-22.2).
 *
 * Todas as datas do dashboard passam a ser calculadas em America/Sao_Paulo via
 * Intl.DateTimeFormat, nunca com `new Date()`/`getFullYear()` locais do processo
 * Node (que rodam em UTC ou no timezone do host, não necessariamente o do Brasil).
 */

export const APP_TIMEZONE = 'America/Sao_Paulo' as const;

export interface DateRange {
  /** yyyy-MM-dd, inclusive, no timezone America/Sao_Paulo */
  startDate: string;
  /** yyyy-MM-dd, inclusive, no timezone America/Sao_Paulo */
  endDate: string;
  timezone: typeof APP_TIMEZONE;
  includeToday: boolean;
}

export type DatePresetId =
  | 'today'
  | 'yesterday'
  | 'last_7d'
  | 'last_30d'
  | 'current_month'
  | 'previous_month'
  | 'current_year'
  | 'custom';

export type ComparisonMode =
  | 'previous_period'
  | 'previous_month_equivalent'
  | 'previous_month_full'
  | 'previous_year_equivalent'
  | 'same_month_2025'
  | 'none';

export const DATE_PRESET_LABEL: Record<DatePresetId, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  last_7d: 'Últimos 7 dias',
  last_30d: 'Últimos 30 dias',
  current_month: 'Mês atual',
  previous_month: 'Mês anterior',
  current_year: 'Ano atual',
  custom: 'Período personalizado',
};

export const COMPARISON_MODE_LABEL: Record<ComparisonMode, string> = {
  previous_period: 'Período anterior equivalente',
  previous_month_equivalent: 'Mesmo intervalo do mês anterior',
  previous_month_full: 'Mês anterior fechado',
  previous_year_equivalent: 'Mesmo período do ano anterior',
  same_month_2025: 'Mesmo mês de 2025',
  none: 'Sem comparação',
};

/** yyyy-MM-dd "hoje" em America/Sao_Paulo, independente do timezone do processo. */
export function todayInAppTimezone(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(new Date());
}

/** Quantidade de dias no mês `yyyy-MM` — usado pelo cálculo de pace (briefing seção 17.2). */
export function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
}

function parseISODate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

function toISODate(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Soma/subtrai dias de uma data yyyy-MM-dd tratada como data civil (sem componente de hora). */
function addDaysISO(iso: string, days: number): string {
  const { year, month, day } = parseISODate(iso);
  // Meio-dia UTC evita qualquer problema de borda de DST ao converter de volta.
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function daysBetweenISO(start: string, end: string): number {
  const a = parseISODate(start);
  const b = parseISODate(end);
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((db - da) / (24 * 60 * 60 * 1000)) + 1; // inclusive
}

function firstDayOfMonthISO(iso: string): string {
  const { year, month } = parseISODate(iso);
  return toISODate(year, month, 1);
}

function lastDayOfMonthISO(iso: string): string {
  const { year, month } = parseISODate(iso);
  const d = new Date(Date.UTC(year, month, 0, 12)); // dia 0 do mês seguinte = último dia do mês atual
  return toISODate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function firstDayOfYearISO(iso: string): string {
  const { year } = parseISODate(iso);
  return toISODate(year, 1, 1);
}

function shiftMonthsISO(iso: string, months: number): string {
  const { year, month, day } = parseISODate(iso);
  const d = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const targetYear = d.getUTCFullYear();
  const targetMonth = d.getUTCMonth() + 1;
  const lastDay = Number(lastDayOfMonthISO(toISODate(targetYear, targetMonth, 1)).slice(-2));
  return toISODate(targetYear, targetMonth, Math.min(day, lastDay));
}

function shiftYearsISO(iso: string, years: number): string {
  const { year, month, day } = parseISODate(iso);
  return toISODate(year + years, month, day);
}

export function buildPreset(preset: DatePresetId, includeToday = true): DateRange {
  const today = todayInAppTimezone();

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today, timezone: APP_TIMEZONE, includeToday: true };
    case 'yesterday': {
      const yest = addDaysISO(today, -1);
      return { startDate: yest, endDate: yest, timezone: APP_TIMEZONE, includeToday: true };
    }
    case 'last_7d':
      return applyIncludeToday(
        { startDate: addDaysISO(today, -6), endDate: today, timezone: APP_TIMEZONE, includeToday: true },
        includeToday,
      );
    case 'last_30d':
      return applyIncludeToday(
        { startDate: addDaysISO(today, -29), endDate: today, timezone: APP_TIMEZONE, includeToday: true },
        includeToday,
      );
    case 'current_month':
      return applyIncludeToday(
        { startDate: firstDayOfMonthISO(today), endDate: today, timezone: APP_TIMEZONE, includeToday: true },
        includeToday,
      );
    case 'previous_month': {
      const prevMonthAnyDay = shiftMonthsISO(today, -1);
      return {
        startDate: firstDayOfMonthISO(prevMonthAnyDay),
        endDate: lastDayOfMonthISO(prevMonthAnyDay),
        timezone: APP_TIMEZONE,
        includeToday: true,
      };
    }
    case 'current_year':
      return applyIncludeToday(
        { startDate: firstDayOfYearISO(today), endDate: today, timezone: APP_TIMEZONE, includeToday: true },
        includeToday,
      );
    case 'custom':
      return { startDate: today, endDate: today, timezone: APP_TIMEZONE, includeToday: true };
  }
}

/** Regra 7.4: exclui o dia corrente de um range "aberto" quando includeToday=false. */
export function applyIncludeToday(range: DateRange, includeToday: boolean): DateRange {
  const today = todayInAppTimezone();
  if (includeToday || range.endDate !== today) {
    return { ...range, includeToday };
  }
  const newEnd = addDaysISO(today, -1);
  // Range de um dia só (ex.: "Hoje") não deve virar vazio — mantém a regra apenas
  // para ranges com mais de um dia.
  if (newEnd < range.startDate) {
    return { ...range, includeToday };
  }
  return { ...range, endDate: newEnd, includeToday };
}

/**
 * Regras 7.2/7.3: mesmo número de dias, nunca compara parcial atual com mês
 * completo anterior sem indicação explícita (por isso `previous_month_full`
 * existe como opção separada e sinalizada na UI, não escondida em "período anterior").
 */
export function resolveComparisonRange(current: DateRange, mode: ComparisonMode): DateRange | null {
  if (mode === 'none') return null;
  const span = daysBetweenISO(current.startDate, current.endDate);

  switch (mode) {
    case 'previous_period': {
      const endDate = addDaysISO(current.startDate, -1);
      const startDate = addDaysISO(endDate, -(span - 1));
      return { startDate, endDate, timezone: APP_TIMEZONE, includeToday: true };
    }
    case 'previous_month_equivalent': {
      const startDate = shiftMonthsISO(current.startDate, -1);
      const endDate = addDaysISO(startDate, span - 1);
      return { startDate, endDate, timezone: APP_TIMEZONE, includeToday: true };
    }
    case 'previous_month_full': {
      const anyDayPrevMonth = shiftMonthsISO(current.startDate, -1);
      return {
        startDate: firstDayOfMonthISO(anyDayPrevMonth),
        endDate: lastDayOfMonthISO(anyDayPrevMonth),
        timezone: APP_TIMEZONE,
        includeToday: true,
      };
    }
    case 'previous_year_equivalent': {
      const startDate = shiftYearsISO(current.startDate, -1);
      const endDate = addDaysISO(startDate, span - 1);
      return { startDate, endDate, timezone: APP_TIMEZONE, includeToday: true };
    }
    case 'same_month_2025': {
      const { month, day } = parseISODate(current.startDate);
      const startDate = toISODate(2025, month, day);
      const endDate = addDaysISO(startDate, span - 1);
      return { startDate, endDate, timezone: APP_TIMEZONE, includeToday: true };
    }
  }
}

// --- Serialização para/de URLSearchParams (?from=&to=&compare=&includeToday=&preset=) ---

export interface DateRangeSearchParams {
  from?: string;
  to?: string;
  compare?: string;
  includeToday?: string;
  preset?: string;
}

const VALID_PRESETS: DatePresetId[] = [
  'today',
  'yesterday',
  'last_7d',
  'last_30d',
  'current_month',
  'previous_month',
  'current_year',
  'custom',
];
const VALID_COMPARISONS: ComparisonMode[] = [
  'previous_period',
  'previous_month_equivalent',
  'previous_month_full',
  'previous_year_equivalent',
  'same_month_2025',
  'none',
];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ResolvedFilters {
  range: DateRange;
  preset: DatePresetId;
  comparisonMode: ComparisonMode;
  comparisonRange: DateRange | null;
}

/** Ponto único de leitura do filtro global — usado por todo `app/**\/page.tsx`. */
export function resolveFiltersFromSearchParams(params: DateRangeSearchParams): ResolvedFilters {
  const preset = VALID_PRESETS.includes(params.preset as DatePresetId) ? (params.preset as DatePresetId) : 'last_7d';
  const includeToday = params.includeToday !== 'false';

  let range: DateRange;
  if (preset === 'custom' && params.from && ISO_DATE_RE.test(params.from) && params.to && ISO_DATE_RE.test(params.to)) {
    range = applyIncludeToday(
      { startDate: params.from, endDate: params.to, timezone: APP_TIMEZONE, includeToday: true },
      includeToday,
    );
  } else {
    range = buildPreset(preset, includeToday);
  }

  const comparisonMode = VALID_COMPARISONS.includes(params.compare as ComparisonMode)
    ? (params.compare as ComparisonMode)
    : 'previous_period';
  const comparisonRange = resolveComparisonRange(range, comparisonMode);

  return { range, preset, comparisonMode, comparisonRange };
}

/** Shape do `searchParams` de `app/**\/page.tsx` no App Router do Next 16 (é uma Promise). */
export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Ponto único usado por toda `page.tsx` pra resolver o filtro global a partir da URL. */
export async function resolveFiltersFromPageSearchParams(searchParams: PageSearchParams): Promise<ResolvedFilters> {
  const params = await searchParams;
  return resolveFiltersFromSearchParams({
    preset: firstValue(params.preset),
    from: firstValue(params.from),
    to: firstValue(params.to),
    compare: firstValue(params.compare),
    includeToday: firstValue(params.includeToday),
  });
}

export function formatRangeLabel(range: DateRange): string {
  const fmt = (iso: string) => {
    const { year, month, day } = parseISODate(iso);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  };
  if (range.startDate === range.endDate) return fmt(range.startDate);
  return `${fmt(range.startDate)} – ${fmt(range.endDate)}`;
}
