'use client';

import Link from 'next/link';
import { usePrimiPassi } from '@/hooks/use-primi-passi';

interface Props {
  utenteId: string;
  profiloOk: boolean;
}

export default function ChecklistHub({ utenteId, profiloOk }: Props) {
  const progresso = usePrimiPassi(utenteId, profiloOk);

  if (!progresso || !progresso.incompleto) return null;

  const completati = [progresso.profilo, progresso.giro, progresso.moto].filter(Boolean).length;

  const passi = [
    { ok: progresso.profilo, titolo: 'Completa il profilo', href: '/account' },
    { ok: progresso.giro, titolo: 'Traccia il primo giro', href: '/traccia' },
    { ok: progresso.moto, titolo: 'Crea l\'avatar 3D moto', href: '/garage' },
  ];

  return (
    <section className="px-4 pb-2">
      <div className="rounded-app-lg border border-brand/25 bg-brand/[0.06] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand">Primi passi</p>
            <p className="mt-1 font-display text-xl font-bold uppercase tracking-tight text-white">
              {completati}/3 completati
            </p>
          </div>
          <div className="flex gap-1">
            {passi.map((passo) => (
              <span
                key={passo.titolo}
                className={`h-2 w-10 rounded-full ${passo.ok ? 'bg-brand' : 'bg-white/15'}`}
              />
            ))}
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {passi.filter((p) => !p.ok).map((passo) => (
            <li key={passo.titolo}>
              <Link
                href={passo.href}
                className="tap flex items-center justify-between rounded-app border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-cemento transition-colors hover:border-brand/30"
              >
                <span>{passo.titolo}</span>
                <span className="font-mono text-[10px] uppercase text-brand">Vai →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Esportato per TutorialPrimoAccesso: salta il tutorial se la checklist è visibile */
export function useChecklistVisibile(utenteId: string | undefined, profiloOk: boolean) {
  const progresso = usePrimiPassi(utenteId, profiloOk);
  return progresso?.incompleto ?? false;
}
