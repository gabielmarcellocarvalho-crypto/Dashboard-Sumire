'use server';

import { revalidatePath } from 'next/cache';
import { upsertGoal, type MonthlyGoal } from '@/lib/goals';

function parseOptionalNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Metas nunca são inferidas automaticamente (briefing v3, seção 17.1) — só existem se o operador cadastrar. */
export async function saveGoal(formData: FormData): Promise<void> {
  const month = String(formData.get('month') ?? '');
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('Mês inválido — use o formato yyyy-MM.');

  const goal: MonthlyGoal = {
    month,
    revenueCaptured: parseOptionalNumber(formData, 'revenueCaptured'),
    revenueBilled: parseOptionalNumber(formData, 'revenueBilled'),
    ordersCaptured: parseOptionalNumber(formData, 'ordersCaptured'),
    ordersBilled: parseOptionalNumber(formData, 'ordersBilled'),
    sessions: parseOptionalNumber(formData, 'sessions'),
    conversionRate: parseOptionalNumber(formData, 'conversionRate'),
    avgTicket: parseOptionalNumber(formData, 'avgTicket'),
    totalInvestment: parseOptionalNumber(formData, 'totalInvestment'),
    budgetMeta: parseOptionalNumber(formData, 'budgetMeta'),
    budgetGoogle: parseOptionalNumber(formData, 'budgetGoogle'),
    mer: parseOptionalNumber(formData, 'mer'),
    costPerSession: parseOptionalNumber(formData, 'costPerSession'),
    notes: (formData.get('notes') as string) || null,
    owner: (formData.get('owner') as string) || null,
    updatedAt: new Date().toISOString(),
  };

  await upsertGoal(goal);

  revalidatePath('/metas');
  revalidatePath('/');
}
