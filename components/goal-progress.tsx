import type { PaceResult } from '@/lib/pace';

export type GoalValueFormat = (v: number) => string;

/**
 * Barra de progresso/bullet chart pra meta × pace — NUNCA velocímetro circular
 * (regra explícita do briefing v3, seção 9.4). Mostra realizado, marcador de
 * "esperado até a data" (pace) e a meta como topo da trilha.
 */
export function GoalProgress({
  label,
  actual,
  goal,
  pace,
  format,
  color = '#FF1476',
}: {
  label: string;
  actual: number;
  goal: number;
  pace: PaceResult;
  format: GoalValueFormat;
  color?: string;
}) {
  const attainmentPct = goal > 0 ? Math.min((actual / goal) * 100, 130) : 0;
  const expectedPct = pace.expectedToDate !== null && goal > 0 ? Math.min((pace.expectedToDate / goal) * 100, 100) : null;

  const status: 'ahead' | 'on_track' | 'behind' | null =
    pace.paceIndex === null ? null : pace.paceIndex >= 1.03 ? 'ahead' : pace.paceIndex >= 0.97 ? 'on_track' : 'behind';
  const statusLabel = { ahead: 'Acima do pace', on_track: 'Em linha com o pace', behind: 'Abaixo do pace' };

  return (
    <div className="goal-progress">
      <div className="goal-progress-head">
        <span className="lab">{label}</span>
        <span className="num tnum">
          {format(actual)} <span className="muted"> / meta {format(goal)}</span>
        </span>
      </div>
      <div className="funnel-track goal-track">
        <div className="funnel-bar" style={{ width: `${Math.max(attainmentPct, 1)}%`, background: color }} />
        {expectedPct !== null && (
          <div className="goal-expected-marker" style={{ left: `${expectedPct}%` }} title="Esperado até a data (pace)" />
        )}
      </div>
      <div className="goal-progress-foot">
        <span>Atingimento: {(attainmentPct).toFixed(0)}%</span>
        {status && <span className={`goal-status goal-status-${status}`}>{statusLabel[status]}</span>}
        {pace.requiredPerRemainingDay !== null && pace.requiredPerRemainingDay > 0 && (
          <span>Necessário/dia: {format(pace.requiredPerRemainingDay)}</span>
        )}
      </div>
    </div>
  );
}
