'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const GRID_COLOR = 'rgba(255,255,255,0.07)';
const TEXT_MUTED = '#847d95';

export interface ComboBarSeries {
  type: 'bar';
  label: string;
  color: string;
  values: (number | null)[];
}

export interface ComboLineSeries {
  type: 'line';
  label: string;
  color: string;
  values: (number | null)[];
  /** Eixo Y separado (ex.: MER numa escala bem diferente de R$) — briefing v3 seção 9.5/20.4. */
  axis: 'primary' | 'secondary';
  /** Formatação do tooltip/eixo — moeda (padrão) ou número decimal simples (ex.: MER "3,4x"). */
  valueFormat?: (v: number) => string;
}

type ComboSeries = ComboBarSeries | ComboLineSeries;

/**
 * Barras + linhas com eixo secundário — usado pelo Overview pra
 * receita × investimento × MER (briefing v3 seção 9.5). Não existia
 * nenhum chart combinado no projeto antes desta tela.
 */
export function ComboChart({
  series,
  labels,
  height = 300,
  currencyFormat = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v),
}: {
  series: ComboSeries[];
  labels: string[];
  height?: number;
  currencyFormat?: (v: number) => string;
}) {
  const hasSecondary = series.some((s) => s.type === 'line' && s.axis === 'secondary');

  return (
    <div style={{ height }}>
      <Chart
        type="bar"
        data={{
          labels,
          datasets: series.map((s) =>
            s.type === 'bar'
              ? {
                  type: 'bar' as const,
                  label: s.label,
                  data: s.values,
                  backgroundColor: s.color,
                  borderRadius: 4,
                  maxBarThickness: 22,
                  yAxisID: 'y',
                  order: 2,
                }
              : {
                  type: 'line' as const,
                  label: s.label,
                  data: s.values,
                  borderColor: s.color,
                  backgroundColor: s.color,
                  pointRadius: 2,
                  pointHoverRadius: 4,
                  borderWidth: 2,
                  tension: 0.3,
                  spanGaps: true,
                  yAxisID: s.axis === 'secondary' ? 'y1' : 'y',
                  order: 1,
                },
          ),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { color: TEXT_MUTED, font: { size: 11 } } },
            tooltip: {
              backgroundColor: '#2c2539',
              borderColor: 'rgba(255,255,255,0.14)',
              borderWidth: 1,
              titleColor: '#f6f4fa',
              bodyColor: '#b7b1c4',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const s = series[ctx.datasetIndex];
                  const raw = ctx.parsed.y;
                  if (raw === null || raw === undefined) return `${s.label}: —`;
                  const format = s.type === 'line' && s.valueFormat ? s.valueFormat : currencyFormat;
                  return `${s.label}: ${format(raw)}`;
                },
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: TEXT_MUTED, font: { size: 10.5 } } },
            y: {
              position: 'left',
              grid: { color: GRID_COLOR },
              ticks: { color: TEXT_MUTED, font: { size: 10.5 }, callback: (v) => currencyFormat(Number(v)) },
              border: { display: false },
            },
            ...(hasSecondary
              ? {
                  y1: {
                    position: 'right' as const,
                    grid: { display: false },
                    ticks: { color: TEXT_MUTED, font: { size: 10.5 } },
                    border: { display: false },
                  },
                }
              : {}),
          },
        }}
      />
    </div>
  );
}
