'use client';

import { AreaChart, Area, Grid, XAxis, ChartTooltip } from '@/components/ui/area-chart';
import { formatCurrency } from '@/lib/format';

/** Ver nota em reach-area-chart.tsx sobre por que isso precisa ser um Client Component próprio. */
export function RevenueAreaChart({ data, color = '#7E68D8' }: { data: Record<string, unknown>[]; color?: string }) {
  return (
    <AreaChart data={data} aspectRatio="3 / 1">
      <Grid horizontal />
      <Area dataKey="revenue" fill={color} fillOpacity={0.3} fadeEdges />
      <XAxis />
      <ChartTooltip rows={(point) => [{ color, label: 'Receita', value: formatCurrency(point.revenue as number) }]} />
    </AreaChart>
  );
}
