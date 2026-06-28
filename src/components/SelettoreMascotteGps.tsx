'use client';

import { useEffect, useState } from 'react';
import {
  MASCOTTE_GPS,
  MOTO_GPS_FUTURE,
  leggiMascotGps,
  salvaMascotGps,
  type IdMascotGps,
} from '@/lib/mascot-gps';

interface Props {
  compatto?: boolean;
  onChange?: (id: IdMascotGps) => void;
}

export default function SelettoreMascotteGps({ compatto = false, onChange }: Props) {
  const [selezionata, setSelezionata] = useState<IdMascotGps>('rosso');

  useEffect(() => {
    setSelezionata(leggiMascotGps());
  }, []);

  function scegli(id: IdMascotGps) {
    setSelezionata(id);
    salvaMascotGps(id);
    onChange?.(id);
  }

  return (
    <section className={`mascot-gps-picker ${compatto ? 'mascot-gps-picker-compact' : ''}`}>
      {!compatto && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">La tua guida GPS</p>
          <p className="mt-1 text-xs leading-relaxed text-cemento/60">
            Scegli la mascotte al posto del pallino blu sulla mappa.
          </p>
        </div>
      )}
      {compatto && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cemento/50">Icona sulla mappa</p>
      )}

      <div className={`mascot-gps-grid ${compatto ? 'mascot-gps-grid-compact' : ''}`}>
        {MASCOTTE_GPS.map((m) => {
          const attiva = selezionata === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => scegli(m.id)}
              className={`mascot-gps-card tap ${attiva ? 'mascot-gps-card-attiva' : ''}`}
              style={{ '--mascot-accent': m.accent } as React.CSSProperties}
              aria-pressed={attiva}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.immagine} alt="" className="mascot-gps-thumb" />
              <span className="mascot-gps-nome">{m.nome}</span>
              {!compatto && <span className="mascot-gps-ruolo">{m.ruolo}</span>}
            </button>
          );
        })}
      </div>

      {!compatto && (
      <div className="mascot-gps-future">
        <p className="font-mono text-[9px] uppercase tracking-wide text-cemento/40">
          Prossimamente · icone moto sbloccabili
        </p>
        <div className="mascot-gps-future-row">
          {MOTO_GPS_FUTURE.map((m) => (
            <span key={m.id} className="mascot-gps-future-chip" title={`${m.nome} — in arrivo`}>
              <span aria-hidden="true">{m.emoji}</span>
              <span className="mascot-gps-future-lock" aria-hidden="true">🔒</span>
            </span>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}
