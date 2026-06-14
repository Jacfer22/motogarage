'use client';

import Link from 'next/link';
import MappaItinerario from '@/components/MappaItinerario';
import NavigazioneClient from '@/components/NavigazioneClient';
import { useAuth } from './AuthProvider';
import { Accesso, ProExtra, Tappa } from '@/lib/types';

const TIPO_LABEL: Record<string, string> = {
  partenza: 'Partenza',
  panorama: 'Panorama',
  cibo: 'Dove si mangia',
  benzina: 'Benzina',
  sosta: 'Sosta',
  arrivo: 'Arrivo',
};

interface Props {
  titolo: string;
  accesso: Accesso;
  tappe: Tappa[];
  tracciato: [number, number][];
  strada: string | null;
  stradaFonte: string | null;
  proExtra: ProExtra | null | undefined;
  gpxUrl: string | null;
}

function BloccoMappa({
  tappe,
  tracciato,
  strada,
  stradaFonte,
}: Pick<Props, 'tappe' | 'tracciato' | 'strada' | 'stradaFonte'>) {
  return (
    <div className="mt-8">
      {tappe.length > 0 ? (
        <MappaItinerario tappe={tappe} tracciato={tracciato} />
      ) : (
        <div className="flex h-72 items-center justify-center border-2 border-dashed border-asfalto/30 font-mono text-sm text-asfalto/50">
          Mappa in arrivo
        </div>
      )}
      {strada && (
        <p className="mt-2 font-mono text-xs uppercase tracking-wide text-asfalto/50">
          Percorso: {strada}
          {stradaFonte && <> · fonte: {stradaFonte}</>}
        </p>
      )}
    </div>
  );
}

function BloccoRoadbook({ tappe }: { tappe: Tappa[] }) {
  if (tappe.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-3xl font-bold uppercase tracking-tight">Roadbook</h2>
      <ol className="mt-4 divide-y-2 divide-asfalto/10 border-2 border-asfalto bg-white">
        {tappe.map((t) => (
          <li key={t.id} className="flex gap-4 px-4 py-3">
            <span className="font-mono text-lg font-medium text-cartello">
              {String(t.ordine).padStart(2, '0')}
            </span>
            <div>
              <p className="font-medium">
                {t.nome}
                <span className="ml-2 font-mono text-xs uppercase text-asfalto/50">
                  {TIPO_LABEL[t.tipo] ?? t.tipo}
                </span>
              </p>
              {t.note && <p className="text-sm text-asfalto/70">{t.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BloccoGpx({ gpxUrl }: { gpxUrl: string | null }) {
  return (
    <section className="mt-10 border-2 border-asfalto bg-asfalto p-6 text-cemento">
      <h2 className="font-display text-3xl font-bold uppercase tracking-tight">Traccia GPX</h2>
      {gpxUrl ? (
        <>
          <p className="mt-2 text-guardrail">
            Percorso proposto da GiroSecco: scaricala e caricala sul navigatore o sull’app
            che usi.
          </p>
          <a
            href={gpxUrl}
            download
            className="mt-4 inline-block bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white"
          >
            Scarica GPX
          </a>
        </>
      ) : (
        <p className="mt-2 font-mono text-sm text-guardrail">
          GPX in arrivo per questo itinerario.
        </p>
      )}
    </section>
  );
}

function BloccoProExtra({ proExtra }: { proExtra: ProExtra }) {
  return (
    <section className="mt-10 border-2 border-segnale bg-white">
      <div className="flex items-center gap-2 border-b-2 border-segnale bg-asfalto px-4 py-2">
        <span className="bg-segnale px-2 py-0.5 font-mono text-xs font-medium uppercase text-asfalto">
          Pro
        </span>
        <span className="font-mono text-xs uppercase tracking-wide text-guardrail">
          Variante e pacchetto weekend
        </span>
      </div>
      <div className="space-y-5 p-5">
        <div>
          <h3 className="font-display text-2xl font-bold uppercase tracking-tight">
            Variante del percorso
          </h3>
          <p className="mt-1 text-asfalto/85">{proExtra.variante}</p>
        </div>
        <div>
          <h3 className="font-display text-2xl font-bold uppercase tracking-tight">
            Pacchetto weekend
          </h3>
          <p className="mt-1 text-asfalto/85">{proExtra.weekend}</p>
        </div>
      </div>
    </section>
  );
}

function Lucchetto({
  titolo,
  testo,
  azione,
}: {
  titolo: string;
  testo: string;
  azione: React.ReactNode;
}) {
  return (
    <section className="mt-8 border-2 border-asfalto bg-asfalto p-6 text-cemento">
      <h2 className="font-display text-2xl font-bold uppercase tracking-tight">{titolo}</h2>
      <p className="mt-2 text-guardrail">{testo}</p>
      {azione}
    </section>
  );
}

export default function ContenutoItinerario({
  titolo,
  accesso,
  tappe,
  tracciato,
  strada,
  stradaFonte,
  proExtra,
  gpxUrl,
}: Props) {
  const { user, profilo, loading, nonConfigurato } = useAuth();

  if (loading) {
    return (
      <p className="mt-8 font-mono text-sm uppercase text-asfalto/40">Caricamento…</p>
    );
  }

  const loggato = nonConfigurato || !!user;
  const pro = nonConfigurato || !!profilo?.is_pro || !!profilo?.is_admin;

  // Pro: serve abbonamento.
  if (accesso === 'pro' && !pro) {
    return (
      <Lucchetto
        titolo="Itinerario Pro"
        testo="Mappa, roadbook, GPX, variante del percorso e pacchetto weekend di questo itinerario sono riservati agli iscritti Pro."
        azione={
          <>
            <Link
              href="/pro"
              className="mt-4 inline-block bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white"
            >
              Sblocca con Pro
            </Link>
            {!user && (
              <p className="mt-3 font-mono text-xs text-guardrail">
                Hai già un account Pro?{' '}
                <Link href="/accedi" className="underline">
                  Accedi
                </Link>
                .
              </p>
            )}
          </>
        }
      />
    );
  }

  // Registrati: basta un account gratuito.
  if (accesso === 'registrati' && !loggato) {
    return (
      <Lucchetto
        titolo="Sblocca con un account gratuito"
        testo="Crea un account gratis per vedere il percorso sulla mappa, il roadbook tappa per tappa e scaricare il GPX. Nessun costo."
        azione={
          <a
            href="/accedi#registrati"
            className="mt-4 inline-block bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white"
          >
            Registrati gratis
          </a>
        }
      />
    );
  }

  // Aperto a tutti: nessun lucchetto.
  return (
    <>
      <BloccoMappa tappe={tappe} tracciato={tracciato} strada={strada} stradaFonte={stradaFonte} />
      <BloccoRoadbook tappe={tappe} />
      {tappe.length > 0 && tracciato.length > 1 && (
        <NavigazioneClient titolo={titolo} tappe={tappe} tracciato={tracciato} />
      )}
      {pro && proExtra && <BloccoProExtra proExtra={proExtra} />}
      <BloccoGpx gpxUrl={gpxUrl} />
    </>
  );
}
