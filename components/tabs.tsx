'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface TabItem {
  href: string;
  label: string;
  /** Ativa a aba se o pathname for exatamente igual (default) ou começar com `activePrefix`/`href`. */
  match?: 'exact' | 'prefix';
  /** Prefixo usado pra decidir "ativo" quando é diferente do próprio href (ex.: link vai pro default de uma sub-seção, mas a aba deve continuar ativa em qualquer sub-rota dela). */
  activePrefix?: string;
}

export function Tabs({ items }: { items: TabItem[] }) {
  const pathname = usePathname();
  return (
    <div className="tabbar">
      {items.map((item) => {
        const prefix = item.activePrefix ?? item.href;
        const active = (item.match ?? 'exact') === 'exact' ? pathname === item.href : pathname.startsWith(prefix);
        return (
          <Link key={item.href} href={item.href} className={`tab${active ? ' active' : ''}`}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
