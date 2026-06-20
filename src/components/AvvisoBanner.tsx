import { Avviso, TipoAvviso } from '@/lib/types';

const STILE: Record<TipoAvviso, { etichetta: string; classi: string; icona: string }> = {
  chiuso: {
    etichetta: 'Strada chiusa',
    classi: 'border-red-400/40 bg-red-500/10 text-red-100',
    icona: '⛔',
  },
  lavori: {
    etichetta: 'Lavori in corso',
    classi: 'border-cartello bg-cartello/10 text-cartello',
    icona: '🚧',
  },
  info: {
    etichetta: 'Info',
    classi: 'border-white/15 bg-carbone text-cemento',
    icona: 'ℹ️',
  },
  consiglio: {
    etichetta: 'Consiglio',
    classi: 'border-bosco bg-bosco/10 text-bosco',
    icona: '💡',
  },
};

function formattaData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
}

export default function AvvisoBanner({ avvisi }: { avvisi: Avviso[] }) {
  if (avvisi.length === 0) return null;

  return (
    <div className="mt-6 flex flex-col gap-3">
      {avvisi.map((avviso) => {
        const stile = STILE[avviso.tipo];
        return (
          <div key={avviso.id} className={`border-2 p-4 ${stile.classi}`}>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide">
              <span>{stile.icona}</span>
              <span>{stile.etichetta}</span>
              <span className="opacity-80">· aggiornato il {formattaData(avviso.data)}</span>
            </div>
            <p className="mt-1.5 font-medium">{avviso.titolo}</p>
            <p className="mt-1 text-sm opacity-95">{avviso.descrizione}</p>
            {avviso.fonte && (
              <p className="mt-2 font-mono text-xs uppercase tracking-wide opacity-75">
                Fonte: {avviso.fonte}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
