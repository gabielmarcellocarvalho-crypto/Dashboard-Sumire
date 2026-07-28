import { PageHeader } from '@/components/page-header';
import { Tabs } from '@/components/tabs';

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Ecommerce" subtitle="Sumirê Perfumaria — Wake Commerce & Wake CRM" />
      <Tabs
        items={[
          { href: '/ecommerce', label: 'Visão geral' },
          { href: '/ecommerce/funil', label: 'Funil' },
        ]}
      />
      {children}
    </>
  );
}
