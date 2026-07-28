import { PageHeader } from '@/components/page-header';
import { Tabs } from '@/components/tabs';

export default function MidiaPagaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Mídia paga" subtitle="Sumirê Perfumaria — Meta Ads e Google Ads" />
      <Tabs
        items={[
          { href: '/midia-paga', label: 'Visão geral' },
          { href: '/midia-paga/meta-ads', label: 'Meta Ads' },
          { href: '/midia-paga/google-ads', label: 'Google Ads' },
        ]}
      />
      {children}
    </>
  );
}
