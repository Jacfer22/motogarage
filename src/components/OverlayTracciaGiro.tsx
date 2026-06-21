'use client';

interface Props {
  stato: 'in_corso' | 'in_pausa';
  velocitaKmh: number;
  kmGiro: string;
  durataGiro: string;
  onPausa: () => void;
  onRiprendi: () => void;
  onTermina: () => void;
  onAnnulla: () => void;
}

export default function OverlayTracciaGiro({
  stato,
  velocitaKmh,
  kmGiro,
  durataGiro,
  onPausa,
  onRiprendi,
  onTermina,
  onAnnulla,
}: Props) {
  return (
    <div className="nav-overlay pointer-events-none absolute inset-0 z-[500] flex flex-col">
      <div className="pointer-events-auto nav-overlay-top safe-top">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand/90">Tracciamento GPS</p>
        <p className="mt-1 font-display text-xl font-black uppercase leading-tight tracking-tight text-white">
          {stato === 'in_corso' ? (
            <span className="text-bosco">● In corso</span>
          ) : (
            <span className="text-cartello">‖ In pausa</span>
          )}
        </p>
      </div>

      <div className="pointer-events-none absolute left-3 top-1/2 z-[501] flex -translate-y-1/2 flex-col gap-2 safe-left">
        <StatBox label="Velocità" valore={String(Math.round(velocitaKmh))} unita="km/h" grande />
        <StatBox label="Giro" valore={kmGiro} unita="km" />
        <StatBox label="Tempo" valore={durataGiro} unita="" />
      </div>

      <div className="pointer-events-auto mt-auto flex flex-wrap items-end justify-end gap-2 px-3 pb-3 safe-bottom">
        {stato === 'in_corso' ? (
          <button type="button" onClick={onPausa} className="tap nav-overlay-btn">
            Pausa
          </button>
        ) : (
          <button type="button" onClick={onRiprendi} className="tap nav-overlay-btn nav-overlay-btn-attivo">
            Riprendi
          </button>
        )}
        <button type="button" onClick={onTermina} className="tap nav-overlay-btn nav-overlay-btn-termina">
          Termina giro
        </button>
        <button type="button" onClick={onAnnulla} className="tap nav-overlay-btn">
          Annulla
        </button>
      </div>
    </div>
  );
}

function StatBox({
  label,
  valore,
  unita,
  grande,
}: {
  label: string;
  valore: string;
  unita: string;
  grande?: boolean;
}) {
  return (
    <div className="nav-stat-box rounded-app border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md">
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-cemento/45">{label}</p>
      <p className={`font-display font-black leading-none text-white ${grande ? 'text-3xl' : 'text-xl'}`}>
        {valore}
        {unita && <span className="ml-0.5 font-mono text-[9px] font-bold text-cemento/55">{unita}</span>}
      </p>
    </div>
  );
}
