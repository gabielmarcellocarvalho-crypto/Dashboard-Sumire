'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarIcon, ChevronDownIcon } from '@/components/icons';
import {
  APP_TIMEZONE,
  COMPARISON_MODE_LABEL,
  DATE_PRESET_LABEL,
  type ComparisonMode,
  type DatePresetId,
  applyIncludeToday,
  buildPreset,
  formatRangeLabel,
  resolveComparisonRange,
  resolveFiltersFromSearchParams,
} from '@/lib/date-range';

const PRESET_ORDER: DatePresetId[] = [
  'today',
  'yesterday',
  'last_7d',
  'last_30d',
  'current_month',
  'previous_month',
  'current_year',
  'custom',
];

const COMPARISON_ORDER: ComparisonMode[] = [
  'previous_period',
  'previous_month_equivalent',
  'previous_month_full',
  'previous_year_equivalent',
  'same_month_2025',
  'none',
];

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const [draftPreset, setDraftPreset] = useState<DatePresetId>(current.preset);
  const [draftFrom, setDraftFrom] = useState(current.range.startDate);
  const [draftTo, setDraftTo] = useState(current.range.endDate);
  const [draftCompare, setDraftCompare] = useState<ComparisonMode>(current.comparisonMode);
  const [draftIncludeToday, setDraftIncludeToday] = useState(current.range.includeToday);

  function openPanel() {
    // Reseta o rascunho a partir do estado atual da URL só ao abrir (não em
    // cada render) — evitar setState dentro de efeito por causa da regra
    // react-hooks/set-state-in-effect do React Compiler ESLint deste projeto.
    setDraftPreset(current.preset);
    setDraftFrom(current.range.startDate);
    setDraftTo(current.range.endDate);
    setDraftCompare(current.comparisonMode);
    setDraftIncludeToday(current.range.includeToday);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const previewRange = useMemo(() => {
    if (draftPreset === 'custom' && draftFrom && draftTo) {
      return applyIncludeToday(
        { startDate: draftFrom, endDate: draftTo, timezone: APP_TIMEZONE, includeToday: true },
        draftIncludeToday,
      );
    }
    return buildPreset(draftPreset, draftIncludeToday);
  }, [draftPreset, draftFrom, draftTo, draftIncludeToday]);

  const previewComparison = useMemo(
    () => resolveComparisonRange(previewRange, draftCompare),
    [previewRange, draftCompare],
  );

  function apply() {
    const next = new URLSearchParams(searchParams.toString());
    next.set('preset', draftPreset);
    if (draftPreset === 'custom') {
      next.set('from', draftFrom);
      next.set('to', draftTo);
    } else {
      next.delete('from');
      next.delete('to');
    }
    next.set('compare', draftCompare);
    next.set('includeToday', String(draftIncludeToday));
    router.push(`${pathname}?${next.toString()}`);
    setOpen(false);
  }

  return (
    <div className="date-range-picker" ref={rootRef}>
      <button
        type="button"
        className="filter primary"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-expanded={open}
      >
        <CalendarIcon />
        <span>
          {DATE_PRESET_LABEL[current.preset]} · {formatRangeLabel(current.range)}
        </span>
        <ChevronDownIcon className={open ? 'drp-chevron open' : 'drp-chevron'} />
      </button>

      {open && (
        <div className="date-range-panel" role="dialog" aria-label="Filtro de período">
          <div className="drp-section">
            <span className="drp-label">Período</span>
            <div className="drp-presets">
              {PRESET_ORDER.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`drp-chip${draftPreset === preset ? ' active' : ''}`}
                  onClick={() => setDraftPreset(preset)}
                >
                  {DATE_PRESET_LABEL[preset]}
                </button>
              ))}
            </div>
          </div>

          {draftPreset === 'custom' && (
            <div className="drp-section drp-custom">
              <label>
                <span className="drp-label">De</span>
                <input type="date" value={draftFrom} max={draftTo} onChange={(e) => setDraftFrom(e.target.value)} />
              </label>
              <label>
                <span className="drp-label">Até</span>
                <input type="date" value={draftTo} min={draftFrom} onChange={(e) => setDraftTo(e.target.value)} />
              </label>
            </div>
          )}

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
        </div>
      )}
    </div>
  );
}
