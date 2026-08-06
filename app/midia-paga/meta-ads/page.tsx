import { PaidPlatformSection } from '@/components/paid-platform-section';
import { getMetaAdsSummary } from '@/lib/data/meta-ads';
import { resolveFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/date-range';

export const dynamic = 'force-dynamic';

export default async function MetaAdsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const { range } = await resolveFiltersFromPageSearchParams(searchParams);
  const metaAds = await getMetaAdsSummary(range);
  return <PaidPlatformSection title="Meta Ads" result={metaAds} />;
}
