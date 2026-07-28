import { PaidPlatformSection } from '@/components/paid-platform-section';
import { getGoogleAdsSummary } from '@/lib/data/google-ads';

export const dynamic = 'force-dynamic';

export default async function GoogleAdsPage() {
  const googleAds = await getGoogleAdsSummary();
  return <PaidPlatformSection title="Google Ads" result={googleAds} />;
}
