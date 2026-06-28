'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import RedirectPostGiro from '@/components/RedirectPostGiro';
import OverlayNavigatore from '@/components/OverlayNavigatore';
import { useTracciamentoGiro } from '@/hooks/use-tracciamento-giro';
import { useNavigazioneVocale } from '@/hooks/use-navigazione-vocale';
import { useFeedback } from '@/components/FeedbackProvider';
import {
  calcolaRotta,
  cercaDestinazione,
  distanzaAlPasso,
  formattaDistanzaNav,
  indicePassoCorrente,
  percorsoRimanente,
  type DestinazioneNav,
  type RottaCalcolata,
} from '@/lib/navigazione-osrm';
import { distanzaRimanenteNav } from '@/lib/chrome-app';
import { leggiModalitaNav, salvaModalitaNav, type ModalitaNav } from '@/lib/nav-modalita';
import OverlayNavigatoreTesto from '@/components/OverlayNavigatoreTesto';
import SelettoreMascotteGps from '@/components/SelettoreMascotteGps';
import { useMascotGpsId } from '@/hooks/use-mascot-gps';

const MappaNavigatore = dynamic(() => import('./MappaNavigatore'), { ssr: false });

export default function PaginaNavigatore() {
  const { user } = useAuth();
  const { conferma } = useFeedback();
  const track = useTracciamentoGiro(user?.id);
  const { mascotId, impostaMascot } = useMascotGpsId();
  const [query, setQuery] = useState('');
  const [risultati, setRisultati] = useState<DestinazioneNav[]>([]);
  const [destinazione, setDestinazione] = useState<DestinazioneNav | null>(null);
  const [rotta, setRotta] = useState<RottaCalcolata | null>(null);
  const [navOn, setNavOn] = useState(false);
  const [caricamento, setCaricamento] = useState(false);
  const [erroreNav, setErroreNav] = useState<string | null>(null);
  const [segui, setSegui] = useState(true);
  const [ricentraTick, setRicentraTick] = useState(0);
  const [voceAttiva, setVoceAttiva] = useState(true);
  const [modalita, setModalita] = useState<ModalitaNav>('mappa');

  useEffect(() => {
    setModalita(leggiModalitaNav());
  }, []);

  function cambiaModalita(m: ModalitaNav) {
    setModalita(m);
    salvaModalitaNav(m);
  }

  useEffect(() => {
    if (navOn) {
      document.body.classList.add('nav-fullscreen-active');
    } else {
      document.body.classList.remove('nav-fullscreen-active');
    }
    return () => document.body.classList.remove('nav-fullscreen-active');
  }, [navOn]);

  async function cerca() {
    setErroreNav(null);
    setCaricamento(true);
    try {
      const elenco = await cercaDestinazione(query);
      setRisultati(elenco);
      if (elenco.length === 0) setErroreNav('Nessun risultato. Prova un altro nome.');
    } catch (e) {
      setErroreNav(e instanceof Error ? e.message : 'Ricerca fallita.');
      setRisultati([]);
    } finally {
      setCaricamento(false);
    }
  }

  async function impostaDestinazione(dest: DestinazioneNav) {
    setDestinazione(dest);
    setRisultati([]);
    setQuery(dest.nome);
    setErroreNav(null);
    setCaricamento(true);
    try {
      const partenza = track.posizioneLive ?? (await ottieniPosizione());
      const nuova = await calcolaRotta(partenza, dest);
      setRotta(nuova);
      setNavOn(true);
      setSegui(true);
      setVoceAttiva(true);
      setRicentraTick((t) => t + 1);

      if (track.stato === 'pronto') {
        const titolo = dest.nome.length > 40 ? `${dest.nome.slice(0, 37)}…` : dest.nome;
        track.setLuogoCard(titolo);
        track.iniziaPercorso(titolo);
      }
    } catch (e) {
      setErroreNav(e instanceof Error ? e.message : 'Percorso non calcolato.');
      setRotta(null);
      setNavOn(false);
    } finally {
      setCaricamento(false);
    }
  }

  async function chiudiNav() {
    if (track.stato === 'in_corso') {
      const ok = await conferma({
        titolo: 'Chiudi navigatore',
        messaggio: 'Chiudere le indicazioni? Il tracciamento GPS continua.',
        conferma: 'Chiudi',
      });
      if (!ok) return;
    }
    setNavOn(false);
    setDestinazione(null);
    setRotta(null);
    setRisultati([]);
  }

  function ricentra() {
    setSegui(true);
    setRicentraTick((t) => t + 1);
  }

  const posizione = track.posizioneLive;
  const passoIdx = rotta && posizione ? indicePassoCorrente(rotta.passi, posizione) : 0;
  const passo = rotta?.passi[passoIdx] ?? null;
  const distanzaMano = passo && posizione ? distanzaAlPasso(posizione, passo) : null;
  const distanzaRimanente =
    rotta && posizione
      ? distanzaRimanenteNav(rotta.passi, passoIdx, posizione, distanzaAlPasso)
      : null;
  const inGiro = track.stato === 'in_corso' || track.stato === 'in_pausa';
  const percorsoDaMostrare =
    rotta && posizione ? percorsoRimanente(rotta.percorso, posizione) : rotta?.percorso;

  useNavigazioneVocale({
    abilitata: navOn && voceAttiva,
    passo,
    passoIdx,
    distanzaMano,
  });

  if (track.stato === 'concluso' && track.giroConcluso) {
    return (
      <RedirectPostGiro
        giro={track.giroConcluso}
        durataSec={track.durataSec}
      />
    );
  }

  if (navOn && passo) {
    const overlayProps = {
      passo,
      distanzaMano,
      distanzaRimanente,
      voceAttiva,
      modalita,
      onToggleVoce: () => setVoceAttiva((v) => !v),
      onCambiaModalita: cambiaModalita,
      onChiudi: chiudiNav,
      onTerminaGiro: inGiro ? () => void track.terminaGiro() : undefined,
      inGiro,
    };

    if (modalita === 'testo') {
      return (
        <div className="nav-fullscreen nav-fullscreen-testo">
          <OverlayNavigatoreTesto {...overlayProps} />
        </div>
      );
    }

    return (
      <div className="nav-fullscreen">
        <MappaNavigatore
          posizione={posizione}
          percorsoNav={percorsoDaMostrare}
          percorsoGps={track.punti}
          mostraTracciatoGps={false}
          destinazione={destinazione}
          segui={segui}
          onSeguiChange={setSegui}
          ricentraTick={ricentraTick}
          mascotId={mascotId}
          fullscreen
        />
        <OverlayNavigatore
          {...overlayProps}
          velocitaKmh={track.velCorrenteKmh}
          onRicentra={ricentra}
          segui={segui}
        />
      </div>
    );
  }

  return (
    <div className="nav-setup-pagina flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="nav-setup-scroll flex-1 overflow-y-auto overscroll-contain">
        <div className="border-b border-white/10 bg-notte px-4 py-5 text-cemento">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">Navigatore</p>
          <h1 className="mt-1 font-display text-2xl font-black uppercase leading-tight tracking-tight text-white">
            Dove vuoi andare?
          </h1>
          <p className="mt-2 text-sm text-cemento/55">
            Scegli la modalità più sicura per te. La rotta rossa è quella da fare — non confonderla col giro già fatto.
          </p>

          <div className="nav-modalita-scelta mt-4">
            <button
              type="button"
              onClick={() => cambiaModalita('mappa')}
              className={`tap nav-modalita-btn ${modalita === 'mappa' ? 'nav-modalita-btn-attivo' : ''}`}
            >
              <span className="font-display text-sm font-black uppercase text-white">Mappa moto</span>
              <span className="mt-1 block text-left text-xs text-cemento/55">Rotta rossa + indicazioni grandi</span>
            </button>
            <button
              type="button"
              onClick={() => cambiaModalita('testo')}
              className={`tap nav-modalita-btn ${modalita === 'testo' ? 'nav-modalita-btn-attivo' : ''}`}
            >
              <span className="font-display text-sm font-black uppercase text-white">Solo scritte · consigliato</span>
              <span className="mt-1 block text-left text-xs text-cemento/55">Sfondo nero · metri e manovra al centro</span>
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cerca()}
              placeholder="Destinazione…"
              className="editor-card-input min-w-0 flex-1"
              maxLength={80}
            />
            <button
              type="button"
              onClick={cerca}
              disabled={caricamento || query.trim().length < 2}
              className="tap btn-primary shrink-0 px-5 disabled:opacity-40"
            >
              Vai
            </button>
          </div>
          {risultati.length > 0 && (
            <ul className="mt-3 max-h-44 overflow-y-auto rounded-app border border-white/10 bg-black/40">
              {risultati.map((r) => (
                <li key={`${r.lat}-${r.lng}`}>
                  <button
                    type="button"
                    onClick={() => impostaDestinazione(r)}
                    className="tap w-full border-b border-white/5 px-3 py-3 text-left text-sm text-cemento/85 last:border-0 hover:bg-brand/10"
                  >
                    {r.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {(erroreNav || track.errore) && (
            <p className="mt-2 text-sm text-red-400">{erroreNav ?? track.errore}</p>
          )}
          {caricamento && (
            <p className="mt-2 font-mono text-[10px] uppercase text-cemento/40">Calcolo percorso…</p>
          )}
          {modalita === 'mappa' && (
            <div className="mt-4">
              <SelettoreMascotteGps compatto onChange={impostaMascot} />
            </div>
          )}
        </div>

        {modalita === 'mappa' ? (
          <div className="nav-setup-mappa relative h-[min(42dvh,320px)] min-h-[200px] w-full shrink-0">
            <MappaNavigatore
              posizione={posizione}
              percorsoNav={rotta?.percorso}
              percorsoGps={track.punti}
              mostraTracciatoGps={false}
              destinazione={destinazione}
              segui={segui}
              onSeguiChange={setSegui}
              ricentraTick={ricentraTick}
              mascotId={mascotId}
              seguiAnimato={false}
            />
          </div>
        ) : (
          <div className="nav-setup-testo-preview shrink-0 px-4 py-8">
            <div className="nav-setup-testo-mock">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand/70">Anteprima solo scritte</p>
              <p className="nav-testo-distanza mt-6 font-display font-black text-brand">250 m</p>
              <p className="nav-testo-manovra mt-4 font-display font-black uppercase text-white">Gira a destra</p>
              <p className="nav-testo-via mt-3 font-display font-bold uppercase text-cemento/60">Via Example</p>
              <p className="mt-8 font-mono text-[10px] uppercase leading-relaxed text-cemento/40">
                Nessuna mappa in strada — solo distanza e manovra, come in navigazione attiva.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/8 bg-notte px-4 py-3 safe-bottom">
        <Link href="/traccia" className="font-mono text-[10px] font-bold uppercase tracking-wide text-cemento/45 underline hover:text-brand">
          Traccia senza destinazione
        </Link>
      </div>
    </div>
  );
}

function ottieniPosizione() {
  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('GPS non disponibile.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Attiva il GPS.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    );
  });
}
