'use client';

import { AreaChart, Area, Grid, XAxis, ChartTooltip } from '@/components/ui/area-chart';
import { formatInt } from '@/lib/format';

/**
 * Wrapper client-side pro AreaChart — necessário porque a função passada em
 * `ChartTooltip.rows` não pode atravessar a fronteira Server->Client Component
 * (React não serializa funções). Aqui ela nasce direto no client, então nunca
 * precisa cruzar essa fronteira.
 */
export function ReachAreaChart({ data, color = '#FF1476' }: { data: Record<string, unknown>[]; color?: string }) {
  return (
    <AreaChart data={data} aspectRatio="3 / 1">
      <Grid horizontal />
      <Area dataKey="reach" fill={color} fillOpacity={0.3} fadeEdges />
      <XAxis />
      <ChartTooltip rows={(point) => [{ color, label: 'Alcance', value: formatInt(point.reach as number) }]} />
    </AreaChart>
  );
}
