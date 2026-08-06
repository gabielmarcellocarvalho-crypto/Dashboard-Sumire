import { PaidPlatformSection } from '@/components/paid-platform-section';
import { getGoogleAdsSummary } from '@/lib/data/google-ads';
import { resolveFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/date-range';

export const dynamic = 'force-dynamic';

export default async function GoogleAdsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const { range } = await resolveFiltersFromPageSearchParams(searchParams);
  const googleAds = await getGoogleAdsSummary(range);
  return <PaidPlatformSection title="Google Ads" result={googleAds} />;
}
