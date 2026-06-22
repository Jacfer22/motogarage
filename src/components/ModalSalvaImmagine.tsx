'use client';

interface Props {
  url: string;
  onChiudi: () => void;
}

/** Fallback iOS/Android quando Web Share non è disponibile: long-press → Salva in Foto. */
export default function ModalSalvaImmagine({ url, onChiudi }: Props) {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-end bg-black/95 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="salva-immagine-titolo"
    >
      <div className="mb-4 w-full max-w-sm space-y-3 text-center">
        <p id="salva-immagine-titolo" className="font-display text-sm font-bold uppercase text-white">
          Salva in galleria
        </p>
        <p className="font-mono text-[11px] leading-relaxed text-white/65">
          Tieni premuto sull&apos;immagine, poi scegli «Aggiungi a Foto», «Salva immagine» o «Download».
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="La tua card MotoGarage"
        className="max-h-[58vh] w-auto max-w-full rounded-app shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      />
      <button
        type="button"
        onClick={onChiudi}
        className="tap mt-5 w-full max-w-sm rounded-app border border-white/20 bg-white/10 py-3 font-mono text-xs font-bold uppercase text-white"
      >
        Chiudi
      </button>
    </div>
  );
}
