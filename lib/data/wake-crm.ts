import type { DataResult } from './types';
import { notConfigured } from './types';

export interface WakeCrmSummary {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  revenueAttributed: number;
}

export async function getWakeCrmSummary(): Promise<DataResult<WakeCrmSummary>> {
  return notConfigured(
    'Wake CRM ainda não configurado: faltam WAKE_CRM_API_URL e WAKE_CRM_API_KEY em .env.local (ver docs/briefing-dashboard-v2.md, seção 20.2).',
  );
}
