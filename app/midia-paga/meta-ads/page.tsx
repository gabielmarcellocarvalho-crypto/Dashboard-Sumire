import { PaidPlatformSection } from '@/components/paid-platform-section';
import { getMetaAdsSummary } from '@/lib/data/meta-ads';

export const dynamic = 'force-dynamic';

export default async function MetaAdsPage() {
  const metaAds = await getMetaAdsSummary();
  return <PaidPlatformSection title="Meta Ads" result={metaAds} />;
}
