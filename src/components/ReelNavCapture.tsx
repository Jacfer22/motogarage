'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import OverlayNavigatore from '@/components/OverlayNavigatore';
import {
  HTML_MARKER_NEON_REEL,
  progressoPercorsoReel,
  tDaFrame,
  type ReelFrameDetail,
} from '@/lib/reel-marketing';
import type { Punto } from '@/lib/geo';
import {
  REEL_NAV_DESTINAZIONE,
  REEL_NAV_PARTENZA,
  lunghezzaPercorso,
  puntoSuPercorso,
  tracciaFinoA,
} from '@/lib/reel-percorso';
import {
  calcolaRotta,
  distanzaAlPasso,
  indicePassoCorrente,
  type RottaCalcolata,
} from '@/lib/navigazione-osrm';
import { distanzaRimanenteNav } from '@/lib/chrome-app';

const MappaNavigatore = dynamic(() => import('./MappaNavigatore'), { ssr: false });

/** Nav reel: sincronizzato frame-by-frame con Playwright — percorso intero, quasi tutto in movimento. */
export default function ReelNavCapture() {
  const [rotta, setRotta] = useState<RottaCalcolata | null>(null);
  const [posizione, setPosizione] = useState<Punto>(REEL_NAV_PARTENZA);
  const [tracciaPercorsa, setTracciaPercorsa] = useState<Punto[]>([]);
  const [pronto, setPronto] = useState(false);
  const [kmGiro, setKmGiro] = useState('0,0');
  const [durataGiro, setDurataGiro] = useState('0:00');
  const [velocita, setVelocita] = useState(0);
  const [adattaTick, setAdattaTick] = useState(0);
  const distRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    document.body.classList.add('nav-fullscreen-active', 'app-immersive-mobile');
    return () => document.body.classList.remove('nav-fullscreen-active', 'app-immersive-mobile');
  }, []);

  useEffect(() => {
    let annullato = false;
    calcolaRotta(REEL_NAV_PARTENZA, REEL_NAV_DESTINAZIONE)
      .then((r) => {
        if (!annullato) {
          setRotta(r);
          setAdattaTick(1);
          setPronto(true);
        }
      })
      .catch(() => {
        if (!annullato) setPronto(true);
      });
    return () => {
      annullato = true;
    };
  }, []);

  const percorso = rotta?.percorso ?? [];
  const lunghezzaM = useMemo(
    () => (percorso.length > 1 ? lunghezzaPercorso(percorso) : 2800),
    [percorso],
  );

  const applicaFrame = useCallback(
    (detail: ReelFrameDetail) => {
      if (percorso.length < 2) return;
      const t = tDaFrame(detail);
      const progress = progressoPercorsoReel(t);
      const distanza = progress * lunghezzaM;
      distRef.current = distanza;
      frameRef.current = detail.frame;

      const { punto } = puntoSuPercorso(percorso, distanza);
      setPosizione(punto);
      setTracciaPercorsa(tracciaFinoA(percorso, distanza));

      const sec = Math.round((detail.frame / 30) * 10) / 10;
      setDurataGiro(`0:${String(Math.min(59, Math.floor(sec))).padStart(2, '0')}`);
      setKmGiro((distanza / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 }));
      setVelocita(progress > 0 ? 24 + progress * 16 : 0);
    },
    [percorso, lunghezzaM],
  );

  useEffect(() => {
    const onFrame = (e: Event) => applicaFrame((e as CustomEvent<ReelFrameDetail>).detail);
    window.addEventListener('reel-nav-frame', onFrame);
    return () => window.removeEventListener('reel-nav-frame', onFrame);
  }, [applicaFrame]);

  const passoIdx = rotta ? indicePassoCorrente(rotta.passi, posizione) : 0;
  const passo = rotta?.passi[passoIdx] ?? {
    istruzione: 'Prosegui verso Piazza del Popolo',
    nomeVia: 'Via Trionfale',
    distanzaM: 280,
    lat: posizione.lat,
    lng: posizione.lng,
  };
  const distanzaMano = distanzaAlPasso(posizione, passo);
  const distanzaRimanente = rotta
    ? distanzaRimanenteNav(rotta.passi, passoIdx, posizione, distanzaAlPasso)
    : Math.max(0, lunghezzaM - distRef.current);

  return (
    <div
      className="nav-fullscreen reel-nav-capture"
      data-reel-nav-ready={pronto && rotta ? 'true' : 'false'}
    >
      <MappaNavigatore
        posizione={posizione}
        percorsoNav={rotta?.percorso}
        percorsoGps={tracciaPercorsa}
        destinazione={REEL_NAV_DESTINAZIONE}
        segui
        onSeguiChange={() => {}}
        ricentraTick={0}
        adattaPercorsoTick={adattaTick}
        fullscreen
        markerPosizioneHtml={HTML_MARKER_NEON_REEL}
        zoomMinimo={15}
        seguiAnimato={false}
      />
      <OverlayNavigatore
        passo={passo}
        distanzaMano={distanzaMano}
        distanzaRimanente={distanzaRimanente}
        velocitaKmh={velocita}
        kmGiro={kmGiro}
        durataGiro={durataGiro}
        voceAttiva
        onToggleVoce={() => {}}
        onChiudi={() => {}}
        onRicentra={() => {}}
        inGiro
        segui
      />
    </div>
  );
}
