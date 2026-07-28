'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Series {
  label: string;
  /** Cor literal (hex/rgb) — Chart.js desenha em canvas, não resolve var() do CSS. */
  color: string;
  values: number[];
}

const GRID_COLOR = 'rgba(255,255,255,0.07)';
const TEXT_MUTED = '#847d95';

export function BarChart({ series, labels, height = 240 }: { series: Series[]; labels: string[]; height?: number }) {
  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels,
          datasets: series.map((s) => ({
            label: s.label,
            data: s.values,
            backgroundColor: s.color,
            borderRadius: 4,
            maxBarThickness: 28,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: series.length > 1, labels: { color: TEXT_MUTED, font: { size: 11 } } },
            tooltip: {
              backgroundColor: '#2c2539',
              borderColor: 'rgba(255,255,255,0.14)',
              borderWidth: 1,
              titleColor: '#f6f4fa',
              bodyColor: '#b7b1c4',
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: TEXT_MUTED, font: { size: 10.5 } } },
            y: { grid: { color: GRID_COLOR }, ticks: { color: TEXT_MUTED, font: { size: 10.5 } }, border: { display: false } },
          },
        }}
      />
    </div>
  );
}
