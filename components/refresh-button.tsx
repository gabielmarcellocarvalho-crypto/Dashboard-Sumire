'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshIcon } from '@/components/icons';

/** Botão "Atualizar" do header (briefing v3 seção 9.2) — força um novo fetch server-side dos dados da página atual. */
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="filter"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshIcon className={isPending ? 'spin' : undefined} />
      <span>{isPending ? 'Atualizando…' : 'Atualizar'}</span>
    </button>
  );
}
