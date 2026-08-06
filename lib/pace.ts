import { daysInMonth, todayInAppTimezone } from '@/lib/date-range';

/**
 * Fórmulas de pace mensal (briefing v3, seção 17.2). Métricas de VOLUME
 * (receita, pedidos, sessões, investimento) usam pace linear; métricas de
 * EFICIÊNCIA (conversão, ticket, MER, ROAS, custo por sessão) NÃO devem usar
 * este pace — seção 17.3 pede só valor atual × meta × diferença pra essas.
 */
export interface PaceResult {
  attainment: number | null; // Realizado ÷ Meta mensal
  monthElapsedRatio: number; // Dias fechados transcorridos ÷ total de dias do mês
  expectedToDate: number | null; // Meta mensal × % do mês transcorrido
  paceIndex: number | null; // Realizado ÷ Esperado até a data
  linearProjection: number | null; // Realizado ÷ % do mês transcorrido
  gap: number | null; // Meta mensal − Realizado
  requiredPerRemainingDay: number | null; // Gap ÷ dias restantes
}

/**
 * `monthKey` no formato yyyy-MM. Usa "dias fechados" por padrão (regra 7.4/17.2
 * — pace mensal não deve contar o dia corrente parcial), ajustável via `includeToday`.
 */
export function computeMonthlyPace(actual: number, monthlyGoal: number | null, monthKey: string, includeToday = false): PaceResult {
  const totalDays = daysInMonth(monthKey);
  const today = todayInAppTimezone();
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const isCurrentMonth = `${todayYear}-${String(todayMonth).padStart(2, '0')}` === monthKey;

  const elapsedDays = isCurrentMonth ? (includeToday ? todayDay : Math.max(todayDay - 1, 0)) : totalDays;
  const monthElapsedRatio = Math.min(elapsedDays / totalDays, 1);

  if (monthlyGoal === null || monthlyGoal === 0) {
    return {
      attainment: null,
      monthElapsedRatio,
      expectedToDate: null,
      paceIndex: null,
      linearProjection: null,
      gap: null,
      requiredPerRemainingDay: null,
    };
  }

  const expectedToDate = monthlyGoal * monthElapsedRatio;
  const paceIndex = expectedToDate > 0 ? actual / expectedToDate : null;
  const linearProjection = monthElapsedRatio > 0 ? actual / monthElapsedRatio : null;
  const gap = monthlyGoal - actual;
  const remainingDays = Math.max(totalDays - elapsedDays, 0);
  const requiredPerRemainingDay = remainingDays > 0 ? gap / remainingDays : null;

  return {
    attainment: actual / monthlyGoal,
    monthElapsedRatio,
    expectedToDate,
    paceIndex,
    linearProjection,
    gap,
    requiredPerRemainingDay,
  };
}
