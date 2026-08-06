'use client';

import { useMemo, useState } from 'react';
import { formatCurrency, formatInt, formatPercent } from '@/lib/format';
import { ChevronDownIcon } from '@/components/icons';

export interface ChannelMatrixRow {
  channel: string;
  sessions: number;
  transactions: number;
  revenue: number;
}

type SortKey = 'channel' | 'sessions' | 'sessionShare' | 'transactions' | 'conversionRate' | 'revenue' | 'revenueShare' | 'revenuePerSession';

function SortableTh({
  label,
  columnKey,
  num = true,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  columnKey: SortKey;
  num?: boolean;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === columnKey;
  return (
    <th className={num ? 'num' : undefined}>
      <button type="button" className={`sortable-th${active ? ' active' : ''}`} onClick={() => onSort(columnKey)}>
        {label}
        <ChevronDownIcon className={active && sortDir === 'asc' ? 'sort-chevron flip' : 'sort-chevron'} />
      </button>
    </th>
  );
}

/**
 * Matriz ordenável de receita por canal — substitui o donut como visual
 * principal (briefing v3 seção 9.7/20.5); um donut compacto complementar
 * fica a cargo da página que consome este componente.
 */
export function ChannelMatrixTable({ rows }: { rows: ChannelMatrixRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const totalSessions = rows.reduce((a, r) => a + r.sessions, 0);
  const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);

  const enriched = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        sessionShare: totalSessions > 0 ? (r.sessions / totalSessions) * 100 : 0,
        conversionRate: r.sessions > 0 ? (r.transactions / r.sessions) * 100 : 0,
        revenueShare: totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0,
        avgTicket: r.transactions > 0 ? r.revenue / r.transactions : 0,
        revenuePerSession: r.sessions > 0 ? r.revenue / r.sessions : 0,
      })),
    [rows, totalSessions, totalRevenue],
  );

  const sorted = useMemo(() => {
    const copy = [...enriched];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [enriched, sortKey, sortDir]);

  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  if (rows.length === 0) return null;

  const thProps = { sortKey, sortDir, onSort: sortBy };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <SortableTh label="Canal" columnKey="channel" num={false} {...thProps} />
            <SortableTh label="Sessões" columnKey="sessions" {...thProps} />
            <SortableTh label="% Sessões" columnKey="sessionShare" {...thProps} />
            <SortableTh label="Transações" columnKey="transactions" {...thProps} />
            <SortableTh label="Conversão" columnKey="conversionRate" {...thProps} />
            <SortableTh label="Receita GA4" columnKey="revenue" {...thProps} />
            <SortableTh label="% Receita" columnKey="revenueShare" {...thProps} />
            <SortableTh label="Receita/sessão" columnKey="revenuePerSession" {...thProps} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.channel}>
              <td className="num-strong">{r.channel}</td>
              <td className="num">{formatInt(r.sessions)}</td>
              <td className="num">{formatPercent(r.sessionShare)}</td>
              <td className="num">{formatInt(r.transactions)}</td>
              <td className="num">{formatPercent(r.conversionRate)}</td>
              <td className="num">{formatCurrency(r.revenue)}</td>
              <td className="num">{formatPercent(r.revenueShare)}</td>
              <td className="num">{formatCurrency(r.revenuePerSession)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
