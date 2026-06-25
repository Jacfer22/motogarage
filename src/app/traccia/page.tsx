'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import WizardGiroConcluso from '@/components/WizardGiroConcluso';
import OverlayTracciaGiro from '@/components/OverlayTracciaGiro';
import AppPageShell from '@/components/AppPageShell';
import AuthWall, { AuthWallLoading } from '@/components/AuthWall';
import { Button } from '@/components/Button';
import { useTracciamentoGiro } from '@/hooks/use-tracciamento-giro';
import AvvisoGpsTraccia from '@/components/AvvisoGpsTraccia';
import OnboardingTraccia from '@/components/OnboardingTraccia';
import IconaGpsLive from '@/components/icons/IconaGpsLive';

const MappaTraccia = dynamic(() => import('@/components/MappaTraccia'), { ssr: false });

export default function PaginaTraccia() {
  const { user, loading } = useAuth();
  const track = useTracciamentoGiro(user?.id);

  const tracciaAttiva = track.stato === 'in_corso' || track.stato === 'in_pausa';

  useEffect(() => {
    if (tracciaAttiva) {
      document.body.classList.add('nav-fullscreen-active');
    } else {
      document.body.classList.remove('nav-fullscreen-active');
    }
    return () => document.body.classList.remove('nav-fullscreen-active');
  }, [tracciaAttiva]);

  if (loading) {
    return (
      <AppPageShell>
        <AuthWallLoading />
      </AppPageShell>
    );
  }

  if (!user) {
    return (
      <AppPageShell>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">Tracciamento GPS</p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
          Traccia un giro
        </h1>
        <div className="mt-6">
          <AuthWall
            titolo="Registra il tuo percorso"
            descrizione="Registra il percorso via GPS e genera la card da condividere. Serve un account gratuito."
          />
        </div>
      </AppPageShell>
    );
  }

  if (track.stato === 'concluso' && track.giroConcluso) {
    return (
      <AppPageShell className="!py-4">
        <WizardGiroConcluso
          giroConcluso={track.giroConcluso}
          distanzaM={track.distanzaM}
          durataSec={track.durataSec}
          punti={track.punti}
          luogoCard={track.luogoCard}
          onLuogoCardChange={track.setLuogoCard}
          salvataggioCloud={track.salvataggioCloud}
          loggato={!!user}
          onNomeChange={track.aggiornaNomeGiro}
          onPubblicoChange={track.giroConcluso.cloudId ? track.impostaGiroPubblico : undefined}
          onElimina={track.eliminaGiroConcluso}
          onNuovoGiro={track.nuovoGiro}
          info={track.info}
        />
      </AppPageShell>
    );
  }

  if (tracciaAttiva) {
    return (
      <div className="nav-fullscreen">
        <MappaTraccia punti={track.punti} inCorso={track.stato === 'in_corso'} fullscreen />
        <OverlayTracciaGiro
          stato={track.stato as 'in_corso' | 'in_pausa'}
          velocitaKmh={track.velCorrenteKmh}
          kmGiro={track.formattaKm(track.distanzaM)}
          durataGiro={track.formattaDurata(track.durataSec)}
          onPausa={track.metiInPausa}
          onRiprendi={track.riprendiPercorso}
          onTermina={() => void track.terminaGiro()}
          onAnnulla={track.annullaPercorso}
        />
      </div>
    );
  }

  return (
    <AppPageShell className="pagina-immersiva">
      <OnboardingTraccia pronto={track.stato === 'pronto'} />
      <div className="flex items-center gap-3">
        <IconaGpsLive size={32} className="shrink-0 text-brand" />
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">Tracciamento GPS</p>
          <h1 className="mt-0.5 font-display text-3xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
            Traccia un giro
          </h1>
        </div>
      </div>
      <p className="mt-3 text-sm text-cemento/55">
        Registra il percorso reale. Alla fine, wizard card e condivisione.
      </p>

      {track.info && (
        <p className="mt-4 rounded-app border border-cartello/30 bg-cartello/10 p-3 text-sm text-cemento/85">
          {track.info}
        </p>
      )}
      {track.errore && (
        <p className="mt-4 rounded-app border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-300">{track.errore}</p>
      )}

      {track.punti.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-cemento/55">
            Tracciato GPS in tempo reale
          </p>
          <MappaTraccia punti={track.punti} inCorso={false} />
        </div>
      )}

      {track.stato === 'pronto' && (
        <div className="mt-8 flex flex-col gap-4">
          <AvvisoGpsTraccia />
          <Button fullWidth onClick={() => track.iniziaPercorso()}>
            Inizia percorso
          </Button>
          <p className="text-center text-sm text-cemento/50">
            Con destinazione?{' '}
            <Link href="/naviga" className="font-mono text-xs uppercase text-brand underline hover:text-brand-chiaro">
              Apri navigatore →
            </Link>
          </p>
        </div>
      )}
    </AppPageShell>
  );
}
