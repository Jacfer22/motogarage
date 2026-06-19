'use client';

import { useEffect, useState } from 'react';
import { SEZIONI_SCHEDA_MOTO, type SchedaModifiche, normalizzaScheda } from '@/lib/scheda-moto';

interface Props {
  scheda: SchedaModifiche;
  salvando?: boolean;
  onSalva: (scheda: SchedaModifiche) => void | Promise<void>;
}

export default function EditorSchedaMoto({ scheda, salvando, onSalva }: Props) {
  const [bozza, setBozza] = useState<SchedaModifiche>(scheda);
  const [sporco, setSporco] = useState(false);

  useEffect(() => {
    setBozza(scheda);
    setSporco(false);
  }, [scheda]);

  function aggiorna(id: keyof SchedaModifiche, valore: string) {
    setBozza((s) => ({ ...s, [id]: valore }));
    setSporco(true);
  }

  async function salva() {
    await onSalva(normalizzaScheda(bozza));
    setSporco(false);
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-chiaro">
        Scheda tecnica — parla come vuoi
      </p>
      {SEZIONI_SCHEDA_MOTO.map(({ id, label, placeholder }) => (
        <label key={id} className="block">
          <span className="font-mono text-[10px] font-bold uppercase text-white/80">{label}</span>
          <textarea
            value={bozza[id] ?? ''}
            onChange={(e) => aggiorna(id, e.target.value)}
            placeholder={placeholder}
            rows={2}
            maxLength={800}
            className="mt-1 w-full resize-y rounded-app border border-white/10 bg-black/40 px-3 py-2 text-xs leading-relaxed text-cemento placeholder:text-cemento/30 focus:border-brand/40 focus:outline-none"
          />
        </label>
      ))}
      <button
        type="button"
        onClick={salva}
        disabled={salvando || !sporco}
        className="w-full rounded-app bg-brand px-4 py-3 font-mono text-[10px] font-bold uppercase text-white disabled:opacity-40"
      >
        {salvando ? 'Salvataggio…' : 'Salva scheda'}
      </button>
    </div>
  );
}

/** Versione read-only per profilo/garage pubblico */
export function SchedaMotoLettura({ scheda }: { scheda: SchedaModifiche }) {
  const voci = SEZIONI_SCHEDA_MOTO.filter((s) => (scheda[s.id] ?? '').trim());
  if (voci.length === 0) return null;
  return (
    <dl className="space-y-3">
      {voci.map(({ id, label }) => (
        <div key={id}>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-wide text-asfalto/45">{label}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-asfalto/80">{scheda[id]}</dd>
        </div>
      ))}
    </dl>
  );
}
