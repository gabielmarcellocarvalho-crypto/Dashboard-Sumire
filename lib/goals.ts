import { Redis } from '@upstash/redis';

/**
 * Metas mensais (briefing v3, seção 17.1) — persistidas no Upstash Redis
 * (Vercel Marketplace). Trocado de `data/goals.json` pra cá em 2026-08-06:
 * o app já está deployado na Vercel e o filesystem de funções serverless é
 * efêmero — uma escrita em arquivo local não sobrevive à próxima invocação
 * nem é visível entre instâncias. NUNCA inferidas automaticamente — só
 * existem se cadastradas pelo operador via `/metas`.
 */
export interface MonthlyGoal {
  /** yyyy-MM */
  month: string;
  revenueCaptured: number | null;
  revenueBilled: number | null;
  ordersCaptured: number | null;
  ordersBilled: number | null;
  sessions: number | null;
  conversionRate: number | null;
  avgTicket: number | null;
  totalInvestment: number | null;
  budgetMeta: number | null;
  budgetGoogle: number | null;
  mer: number | null;
  costPerSession: number | null;
  notes: string | null;
  owner: string | null;
  updatedAt: string;
}

const GOALS_KEY = 'sumire:goals';

let _redis: Redis | null = null;
function getRedis(): Redis {
  // A integração "Upstash for Redis" da Vercel Marketplace provisiona
  // KV_REST_API_URL/TOKEN (nome legado de @vercel/kv), não
  // UPSTASH_REDIS_REST_URL/TOKEN — `Redis.fromEnv()` procura o segundo par
  // e falharia. Construir explicitamente com os nomes reais provisionados.
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return _redis;
}

export async function readGoals(): Promise<MonthlyGoal[]> {
  const raw = await getRedis().get<MonthlyGoal[]>(GOALS_KEY);
  return raw ?? [];
}

/** `monthKey` no formato yyyy-MM (ex.: derivado de `range.startDate.slice(0, 7)`). */
export async function findGoalForMonth(monthKey: string): Promise<MonthlyGoal | null> {
  const goals = await readGoals();
  return goals.find((g) => g.month === monthKey) ?? null;
}

export async function upsertGoal(goal: MonthlyGoal): Promise<void> {
  const goals = await readGoals();
  const idx = goals.findIndex((g) => g.month === goal.month);
  if (idx >= 0) goals[idx] = goal;
  else goals.push(goal);
  goals.sort((a, b) => a.month.localeCompare(b.month));
  await getRedis().set(GOALS_KEY, goals);
}
