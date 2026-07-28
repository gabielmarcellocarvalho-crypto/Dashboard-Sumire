'use client';

import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);

interface Slice {
  label: string;
  value: number;
  /** Cor literal (hex/rgb) — Chart.js desenha em canvas, não resolve var() do CSS. */
  color: string;
}

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  size = 150,
}: {
  slices: Slice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
      <Doughnut
        data={{
          labels: slices.map((s) => s.label),
          datasets: [
            {
              data: slices.map((s) => s.value),
              backgroundColor: slices.map((s) => s.color),
              borderColor: '#1c1725',
              borderWidth: 2,
              hoverOffset: 4,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: { display: false },
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
        }}
      />
      {(centerLabel || centerValue) && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {centerLabel && (
            <span style={{ display: 'block', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {centerLabel}
            </span>
          )}
          {centerValue && (
            <span style={{ display: 'block', fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {centerValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function DonutLegend({ slices, total }: { slices: Slice[]; total: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
      {slices.map((s) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flex: '0 0 9px' }} />
          <span style={{ color: 'var(--text-2)', flex: 1 }}>{s.label}</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
