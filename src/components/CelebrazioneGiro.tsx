'use client';

import { useEffect, useMemo, useState } from 'react';

interface Props {
  titolo?: string;
  sottotitolo?: string;
  onFine: () => void;
  durataMs?: number;
}

export default function CelebrazioneGiro({
  titolo = 'Congratulazioni!',
  sottotitolo,
  onFine,
  durataMs = 950,
}: Props) {
  const [attivo, setAttivo] = useState(true);

  const scintille = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        id: i,
        left: `${6 + Math.random() * 88}%`,
        top: `${8 + Math.random() * 50}%`,
        delay: `${Math.random() * 0.4}s`,
        color: ['#f2b705', '#ED2100', '#fde68a', '#ffffff'][i % 4]!,
        tx: `${(Math.random() - 0.5) * 90}px`,
        ty: `${(Math.random() - 0.5) * 90}px`,
      })),
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setAttivo(false);
      onFine();
    }, durataMs);
    return () => clearTimeout(t);
  }, [durataMs, onFine]);

  if (!attivo) return null;

  return (
    <div className="celebrazione-giro" role="status" aria-live="polite">
      <div className="celebrazione-giro-burst" aria-hidden="true">
        {scintille.map((s) => (
          <span
            key={s.id}
            className="celebrazione-scintilla"
            style={
              {
                left: s.left,
                top: s.top,
                backgroundColor: s.color,
                animationDelay: s.delay,
                '--tx': s.tx,
                '--ty': s.ty,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="celebrazione-giro-testo">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-brand">Giro concluso</p>
        <h2 className="mt-2 font-display text-4xl font-black uppercase leading-none tracking-tight text-white">
          {titolo}
        </h2>
        {sottotitolo && (
          <p className="mt-3 font-mono text-sm uppercase tracking-wide text-cemento/70">{sottotitolo}</p>
        )}
      </div>
    </div>
  );
}
