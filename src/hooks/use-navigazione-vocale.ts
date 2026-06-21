'use client';

import { useEffect, useRef } from 'react';
import type { PassoNavigazione } from '@/lib/navigazione-osrm';
import { formattaDistanzaNav } from '@/lib/navigazione-osrm';

const SOGLIE_M = [400, 150, 80];

function voceItaliana(): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
  const voci = window.speechSynthesis.getVoices();
  return voci.find((v) => v.lang.startsWith('it'));
}

function parla(testo: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(testo);
  u.lang = 'it-IT';
  u.rate = 1.08;
  u.pitch = 1;
  const it = voceItaliana();
  if (it) u.voice = it;
  window.speechSynthesis.speak(u);
}

interface Opzioni {
  abilitata: boolean;
  passo: PassoNavigazione | null;
  passoIdx: number;
  distanzaMano: number | null;
}

export function useNavigazioneVocale({ abilitata, passo, passoIdx, distanzaMano }: Opzioni) {
  const passoPrecedente = useRef(-1);
  const soglieDette = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const onVoices = () => synth.getVoices();
    onVoices();
    synth.addEventListener('voiceschanged', onVoices);
    return () => synth.removeEventListener('voiceschanged', onVoices);
  }, []);

  useEffect(() => {
    if (!abilitata || !passo) return;

    if (passoIdx !== passoPrecedente.current) {
      passoPrecedente.current = passoIdx;
      soglieDette.current = new Set();
      parla(passo.istruzione);
      return;
    }

    if (distanzaMano === null || passo.istruzione === 'Sei arrivato a destinazione') return;

    for (const soglia of SOGLIE_M) {
      if (distanzaMano <= soglia && !soglieDette.current.has(soglia)) {
        soglieDette.current.add(soglia);
        parla(`Tra ${formattaDistanzaNav(distanzaMano)}, ${passo.istruzione.toLowerCase()}`);
        break;
      }
    }
  }, [abilitata, passo, passoIdx, distanzaMano]);

  useEffect(() => {
    if (!abilitata && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
  }, [abilitata]);
}
