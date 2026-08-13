'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import {
  APP_TIMEZONE,
  COMPARISON_MODE_LABEL,
  type ComparisonMode,
  applyIncludeToday,
  formatRangeLabel,
  resolveComparisonRange,
  resolveFiltersFromSearchParams,
  todayInAppTimezone,
} from '@/lib/date-range';

const COMPARISON_ORDER: ComparisonMode[] = [
  'previous_period',
  'previous_month_equivalent',
  'previous_month_full',
  'previous_year_equivalent',
  'same_month_2025',
  'none',
];

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface PanelPosition {
  top: number;
  right: number;
}

interface CalendarMonth {
  year: number;
  month: number; // 1-12
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseISO(iso: string): CalendarMonth & { day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

function daysInCalendarMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 0 = domingo ... 6 = sábado, do dia 1 do mês. */
function firstWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

function shiftCalendarMonth({ year, month }: CalendarMonth, delta: number): CalendarMonth {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const current = useMemo(
    () =>
      resolveFiltersFromSearchParams({
        preset: searchParams.get('preset') ?? undefined,
        from: searchParams.get('from') ?? undefined,
        to: searchParams.get('to') ?? undefined,
        compare: searchParams.get('compare') ?? undefined,
        includeToday: searchParams.get('includeToday') ?? undefined,
      }),
    [searchParams],
  );

  const [draftFrom, setDraftFrom] = useState(current.range.startDate);
  const [draftTo, setDraftTo] = useState(current.range.endDate);
  const [draftCompare, setDraftCompare] = useState<ComparisonMode>(current.comparisonMode);
  const [draftIncludeToday, setDraftIncludeToday] = useState(current.range.includeToday);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth>(() => {
    const { year, month } = parseISO(current.range.endDate);
    return { year, month };
  });

  function openPanel() {
    // Reseta o rascunho a partir do estado atual da URL só ao abrir (não em
    // cada render) — evitar setState dentro de efeito por causa da regra
    // react-hooks/set-state-in-effect do React Compiler ESLint deste projeto.
    setDraftFrom(current.range.startDate);
    setDraftTo(current.range.endDate);
    setDraftCompare(current.comparisonMode);
    setDraftIncludeToday(current.range.includeToday);
    setPickingEnd(false);
    setHoverDate(null);
    const { year, month } = parseISO(current.range.endDate);
    setCalendarMonth({ year, month });

    // Painel renderizado via portal em document.body (top/right vêm de style inline,
    // calculados a partir do botão) — precisa ser `fixed`, não `absolute`,
    // e um z-index acima de tudo (sidebar=50, backdrop=45) já que escapou do
    // stacking context do topbar (ver comentário abaixo, no JSX do painel).
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPanelPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const previewRange = useMemo(
    () =>
      applyIncludeToday(
        { startDate: draftFrom, endDate: draftTo, timezone: APP_TIMEZONE, includeToday: true },
        draftIncludeToday,
      ),
    [draftFrom, draftTo, draftIncludeToday],
  );

  const previewComparison = useMemo(
    () => resolveComparisonRange(previewRange, draftCompare),
    [previewRange, draftCompare],
  );

  function apply() {
    const next = new URLSearchParams(searchParams.toString());
    next.set('preset', 'custom');
    next.set('from', draftFrom);
    next.set('to', draftTo);
    next.set('compare', draftCompare);
    next.set('includeToday', String(draftIncludeToday));
    router.push(`${pathname}?${next.toString()}`);
    setOpen(false);
  }

  function pickDay(iso: string) {
    if (!pickingEnd) {
      setDraftFrom(iso);
      setDraftTo(iso);
      setPickingEnd(true);
    } else if (iso < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(iso);
      setPickingEnd(false);
    } else {
      setDraftTo(iso);
      setPickingEnd(false);
    }
  }

  const today = todayInAppTimezone();
  const rangeEnd = pickingEnd && hoverDate ? (hoverDate < draftFrom ? draftFrom : hoverDate) : draftTo;
  const rangeStart = pickingEnd && hoverDate && hoverDate < draftFrom ? hoverDate : draftFrom;

  const calendarCells = useMemo(() => {
    const { year, month } = calendarMonth;
    const totalDays = daysInCalendarMonth(year, month);
    const leading = firstWeekday(year, month);
    const cells: (string | null)[] = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= totalDays; day++) cells.push(toISO(year, month, day));
    return cells;
  }, [calendarMonth]);

  return (
    <div className="date-range-picker">
      <button
        ref={buttonRef}
        type="button"
        className="filter primary"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-expanded={open}
      >
        <CalendarIcon />
        <span>{formatRangeLabel(current.range)}</span>
        <ChevronDownIcon className={open ? 'drp-chevron open' : 'drp-chevron'} />
      </button>

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            className="date-range-panel"
            role="dialog"
            aria-label="Filtro de período"
            style={{ top: panelPos.top, right: panelPos.right }}
          >
            <div className="drp-section">
              <div className="drp-calendar-header">
                <button type="button" className="drp-cal-nav" onClick={() => setCalendarMonth((m) => shiftCalendarMonth(m, -1))} aria-label="Mês anterior">
                  <ChevronLeftIcon />
                </button>
                <span className="drp-cal-title">
                  {MONTH_LABELS[calendarMonth.month - 1]} {calendarMonth.year}
                </span>
                <button type="button" className="drp-cal-nav" onClick={() => setCalendarMonth((m) => shiftCalendarMonth(m, 1))} aria-label="Próximo mês">
                  <ChevronRightIcon />
                </button>
              </div>

              <div className="drp-calendar-grid">
                {WEEKDAY_LABELS.map((w, i) => (
                  <span key={i} className="drp-cal-weekday">
                    {w}
                  </span>
                ))}
                {calendarCells.map((iso, i) => {
                  if (!iso) return <span key={i} className="drp-cal-day empty" />;
                  const inRange = iso >= rangeStart && iso <= rangeEnd;
                  const isStart = iso === draftFrom;
                  const isEnd = iso === draftTo;
                  const classes = ['drp-cal-day'];
                  if (inRange) classes.push('in-range');
                  if (isStart) classes.push('range-start');
                  if (isEnd) classes.push('range-end');
                  if (iso === today) classes.push('is-today');
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={classes.join(' ')}
                      onClick={() => pickDay(iso)}
                      onMouseEnter={() => setHoverDate(iso)}
                    >
                      {Number(iso.slice(-2))}
                    </button>
                  );
                })}
              </div>

              <p className="drp-hint drp-cal-range">{formatRangeLabel(previewRange)}</p>
            </div>

            <div className="drp-section">
              <span className="drp-label">Comparar com</span>
              <select value={draftCompare} onChange={(e) => setDraftCompare(e.target.value as ComparisonMode)}>
                {COMPARISON_ORDER.map((mode) => (
                  <option key={mode} value={mode}>
                    {COMPARISON_MODE_LABEL[mode]}
                  </option>
                ))}
              </select>
            </div>

            <label className="drp-toggle">
              <input
                type="checkbox"
                checked={draftIncludeToday}
                onChange={(e) => setDraftIncludeToday(e.target.checked)}
              />
              <span>Incluir hoje</span>
            </label>

            <div className="drp-footer">
              <span className="drp-hint">
                {previewComparison ? `Comparando com ${formatRangeLabel(previewComparison)}` : 'Sem comparação'}
              </span>
              <button type="button" className="drp-apply" onClick={apply}>
                Aplicar
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
