import { Tabs } from '@/components/tabs';

export default function PerfumariaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Tabs
        items={[
          { href: '/organico/perfumaria/instagram', label: 'Instagram' },
          { href: '/organico/perfumaria/tiktok', label: 'TikTok' },
        ]}
      />
      {children}
    </>
  );
}
