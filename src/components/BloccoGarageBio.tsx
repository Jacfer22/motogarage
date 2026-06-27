'use client';

import { useState } from 'react';
import { SITE_URL } from '@/lib/home-href';
import { useFeedback } from './FeedbackProvider';

interface Props {
  username: string;
  motoPubblica?: boolean;
  compatto?: boolean;
  kmTotali?: number | null;
  badgeNome?: string | null;
}

export function urlGaragePubblico(username: string) {
  return `${SITE_URL.replace(/\/$/, '')}/garage/${encodeURIComponent(username)}`;
}

export default function BloccoGarageBio({
  username,
  motoPubblica = false,
  compatto = false,
  kmTotali = null,
  badgeNome = null,
}: Props) {
  const { toast } = useFeedback();
  const [copiato, setCopiato] = useState(false);
  const link = urlGaragePubblico(username);

  async function copia() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      toast('Link garage copiato — incollalo in bio Instagram');
      window.setTimeout(() => setCopiato(false), 2500);
    } catch {
      toast('Copia manualmente il link qui sotto', 'info');
    }
  }

  return (
    <div className={`garage-bio-block ${compatto ? 'garage-bio-block-compact' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
            Garage live · link in bio
          </p>
          <p className="mt-1 text-xs leading-relaxed text-cemento/65">
            {motoPubblica
              ? 'Km, badge e ultimo giro si aggiornano da soli ad ogni tracciato. Chi tocca il link apre il tuo garage 3D — perfetto in bio Instagram/TikTok.'
              : 'Attiva «Garage pubblico» sulla moto per sbloccare il link da mettere in bio Instagram.'}
          </p>
          {motoPubblica && (kmTotali !== null || badgeNome) && (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-cemento/50">
              {[
                kmTotali !== null && kmTotali > 0 ? `${kmTotali.toLocaleString('it-IT')} km live` : null,
                badgeNome,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
        <span className="text-lg" aria-hidden="true">📸</span>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <code className="garage-bio-url flex-1 truncate rounded-app border border-white/10 bg-black/30 px-3 py-2 font-mono text-[10px] text-cemento/80">
          {link}
        </code>
        <button
          type="button"
          onClick={() => void copia()}
          disabled={!motoPubblica}
          className="tap shrink-0 rounded-app bg-brand px-4 py-2 font-mono text-[10px] font-bold uppercase text-white disabled:opacity-40"
        >
          {copiato ? 'Copiato!' : 'Copia link'}
        </button>
      </div>
      {!motoPubblica && (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-cemento/40">
          Spunta «Garage pubblico» nel pannello moto
        </p>
      )}
    </div>
  );
}
