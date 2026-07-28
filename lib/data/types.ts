import type { Reliability } from '@/lib/reliability';

/** Envelope padrão de qualquer bloco de dado buscado no dashboard. */
export type DataResult<T> =
  | { status: 'ok'; reliability: Reliability; data: T }
  | { status: 'error'; reliability: 'indisponivel'; reason: string }
  | { status: 'not_configured'; reliability: 'indisponivel'; reason: string };

export function ok<T>(data: T, reliability: Reliability = 'oficial'): DataResult<T> {
  return { status: 'ok', reliability, data };
}

export function notConfigured<T>(reason: string): DataResult<T> {
  return { status: 'not_configured', reliability: 'indisponivel', reason };
}

export function errored<T>(reason: string): DataResult<T> {
  return { status: 'error', reliability: 'indisponivel', reason };
}

export interface OrganicDaily {
  date: string;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  views: number | null;
  mediaSaved: number | null;
  mediaEngagement: number | null;
  newFollowers: number | null;
  storyInteractions: number | null;
  storyViews: number | null;
  profileVisits: number | null;
}

export interface OrganicAccountSummary {
  accountName: string;
  totalFollowers: number | null;
  followersAsOf: string | null;
  periodStart: string;
  periodEnd: string;
  daily: OrganicDaily[];
  totals: {
    reach: number;
    likes: number;
    comments: number;
    views: number;
    mediaSaved: number;
    mediaEngagement: number;
    newFollowers: number;
    storyInteractions: number;
    storyViews: number;
    profileVisits: number;
  };
}

export interface PaidCampaignRow {
  platform: 'Google Ads' | 'Meta Ads';
  campaign: string;
  status: string;
  cost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionsValue: number;
}

export interface PaidMediaSummary {
  platform: 'Google Ads' | 'Meta Ads';
  periodStart: string;
  periodEnd: string;
  cost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionsValue: number;
  campaigns: PaidCampaignRow[];
}

export interface WakeOrderSummary {
  periodStart: string;
  periodEnd: string;
  ordersCaptured: number;
  revenueCaptured: number;
  raw?: unknown;
}
