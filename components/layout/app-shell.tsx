'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GridIcon, MenuIcon, CartIcon, SearchIcon, MegaphoneIcon, UsersIcon, CalendarIcon, TargetIcon, ShieldCheckIcon } from '@/components/icons';
import { DateRangePicker } from '@/components/filters/date-range-picker';
import type { navVisibility } from '@/lib/env';

interface NavLeaf {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Ativa o item se o pathname começar com `href` (seções com sub-rotas). */
  prefix?: boolean;
  /** Chave em `navVisibility` que precisa ser `true` pra este item aparecer — omitido = sempre visível. */
  visibilityKey?: keyof typeof navVisibility;
}

function NavItem({ item }: { item: NavLeaf }) {
  const pathname = usePathname();
  const active = item.prefix ? pathname.startsWith(item.href) : pathname === item.href;
  return (
    <Link href={item.href} className={`nav-item${active ? ' active' : ''}`}>
      {item.icon}
      <span className="grow">{item.label}</span>
    </Link>
  );
}

const SECTIONS: NavLeaf[] = [
  { href: '/', label: 'Overview geral', icon: <GridIcon /> },
  { href: '/midia-paga', label: 'Mídia paga', icon: <MegaphoneIcon />, prefix: true, visibilityKey: 'midiaPaga' },
  { href: '/seo', label: 'SEO', icon: <SearchIcon />, visibilityKey: 'seo' },
  { href: '/ecommerce', label: 'Ecommerce', icon: <CartIcon />, visibilityKey: 'ecommerce' },
  { href: '/organico', label: 'Orgânico', icon: <UsersIcon />, prefix: true, visibilityKey: 'organico' },
  { href: '/metas', label: 'Metas', icon: <TargetIcon /> },
  { href: '/qualidade-dados', label: 'Qualidade de dados', icon: <ShieldCheckIcon /> },
];

export function AppShell({
  children,
  navVisibility,
}: {
  children: React.ReactNode;
  navVisibility: Record<string, boolean>;
}) {
  const [open, setOpen] = useState(false);
  const sections = SECTIONS.filter((item) => !item.visibilityKey || navVisibility[item.visibilityKey]);

  return (
    <div className="app">
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Navegação">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo estático pequeno, sem necessidade de otimização do next/image */}
          <img className="brand-mark" src="/sumire-logo.png" alt="Sumirê" width={93} height={24} />
          <div className="brand-txt">
            <small>Analytics</small>
          </div>
        </div>

        <nav className="nav">
          {sections.map((item) => (
            <NavItem item={item} key={item.href} />
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="avatar">GB</div>
          <div>
            <b>Relatório Sumirê</b>
            <small>V4 Company</small>
          </div>
        </div>
      </aside>
      <div className={`backdrop${open ? ' show' : ''}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="hamburger" aria-label="Abrir menu" onClick={() => setOpen((v) => !v)}>
            <MenuIcon />
          </button>
          <div className="filters" style={{ marginLeft: 0 }}>
            <Suspense
              fallback={
                <button className="filter primary" disabled>
                  <CalendarIcon />
                  <span>Carregando período…</span>
                </button>
              }
            >
              <DateRangePicker />
            </Suspense>
          </div>
        </header>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}
