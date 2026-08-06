import type { Metadata } from 'next';
import { Poppins, DM_Sans } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { cn } from '@/lib/utils';
import { navVisibility } from '@/lib/env';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'Sumirê · Dashboard de Métricas',
  description: 'Métricas orgânicas (Instagram/TikTok) e mídia paga/e-commerce (GA4, Google Ads, Meta Ads, Wake) da Sumirê.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={cn(poppins.variable, dmSans.variable, 'font-sans')}>
      <body>
        <AppShell navVisibility={navVisibility}>{children}</AppShell>
      </body>
    </html>
  );
}
