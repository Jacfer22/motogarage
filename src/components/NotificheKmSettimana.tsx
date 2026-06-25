'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { caricaGiriUtente } from '@/lib/giri-store';
import { formattaKmDisplay } from '@/lib/geo';
import { useFeedback } from './FeedbackProvider';

const CHIAVE_PERM = 'motogarage-notif-km-asked';
const CHIAVE_ULTIMA = 'motogarage-notif-km-week';

function settimanaCorrente() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7)}`;
}

function kmUltimi7Giorni(giri: { km: number; data: string }[]) {
  const limite = Date.now() - 7 * 86400000;
  return giri
    .filter((g) => new Date(g.data).getTime() >= limite)
    .reduce((s, g) => s + g.km, 0);
}

export default function NotificheKmSettimana({ utenteId }: { utenteId: string }) {
  const { toast } = useFeedback();
  const [banner, setBanner] = useState(false);
  const [kmSettimana, setKmSettimana] = useState(0);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    caricaGiriUtente(supabase, utenteId).then((giri) => {
      const km = kmUltimi7Giorni(giri);
      setKmSettimana(km);
      if (km < 0.5) return;

      const week = settimanaCorrente();
      const giaMostrato = localStorage.getItem(CHIAVE_ULTIMA) === week;

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && !giaMostrato) {
        localStorage.setItem(CHIAVE_ULTIMA, week);
        try {
          new Notification('MotoGarage — settimana in sella', {
            body: `Hai fatto ${formattaKmDisplay(km)} km negli ultimi 7 giorni. Continua così!`,
            icon: '/logo-motogarage.png',
          });
        } catch {
          /* ignore */
        }
        return;
      }

      if (!giaMostrato && km >= 1) {
        localStorage.setItem(CHIAVE_ULTIMA, week);
        toast(`Questa settimana: ${formattaKmDisplay(km)} km registrati. Ottimo lavoro!`);
      } else if (!localStorage.getItem(CHIAVE_PERM) && km >= 1) {
        setBanner(true);
      }
    });
  }, [utenteId, toast]);

  async function abilitaNotifiche() {
    localStorage.setItem(CHIAVE_PERM, '1');
    setBanner(false);
    if (typeof Notification === 'undefined') {
      toast('Installa l\'app (PWA) per le notifiche sul telefono', 'info');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      toast('Notifiche attive — ti avvisiamo sui km settimanali');
      try {
        new Notification('MotoGarage', {
          body: `Finora ${formattaKmDisplay(kmSettimana)} km questa settimana.`,
          icon: '/logo-motogarage.png',
        });
      } catch {
        /* ignore */
      }
    } else {
      toast('Notifiche disattivate — puoi riattivarle dalle impostazioni del browser', 'info');
    }
  }

  if (!banner) return null;

  return (
    <div className="notif-km-banner">
      <p className="text-sm text-cemento/80">
        <strong className="text-white">{formattaKmDisplay(kmSettimana)} km</strong> questa settimana — attivi un promemoria?
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => void abilitaNotifiche()} className="tap rounded-app bg-brand px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-white">
          Attiva notifiche
        </button>
        <button type="button" onClick={() => { localStorage.setItem(CHIAVE_PERM, '1'); setBanner(false); }} className="tap font-mono text-[9px] uppercase text-cemento/45">
          No grazie
        </button>
      </div>
    </div>
  );
}
