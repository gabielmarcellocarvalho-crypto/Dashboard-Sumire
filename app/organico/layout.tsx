import { PageHeader } from '@/components/page-header';
import { Tabs } from '@/components/tabs';

export default function OrganicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Orgânico" subtitle="Instagram & TikTok — Sumirê Perfumaria e Sumirê Exclusivos" />
      <Tabs
        items={[
          { href: '/organico', label: 'Visão geral' },
          {
            href: '/organico/perfumaria/instagram',
            label: 'Perfumaria Sumirê',
            match: 'prefix',
            activePrefix: '/organico/perfumaria',
          },
          {
            href: '/organico/exclusivos/instagram',
            label: 'Exclusivos Sumirê',
            match: 'prefix',
            activePrefix: '/organico/exclusivos',
          },
        ]}
      />
      {children}
    </>
  );
}
