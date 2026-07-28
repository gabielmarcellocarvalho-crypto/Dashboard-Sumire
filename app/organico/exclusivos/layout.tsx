import { Tabs } from '@/components/tabs';

export default function ExclusivosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Tabs
        items={[
          { href: '/organico/exclusivos/instagram', label: 'Instagram' },
          { href: '/organico/exclusivos/tiktok', label: 'TikTok' },
        ]}
      />
      {children}
    </>
  );
}
