import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GaragePubblico from '@/components/GaragePubblico';
import { caricaGaragePubblico } from '@/lib/garage-pubblico';
import { SITE_URL } from '@/lib/home-href';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const dati = await caricaGaragePubblico(username);
  const nome = dati?.profilo.username ?? username;
  const km = dati?.stats.kmTotali ?? 0;
  const badge = dati?.stats.badge.nome;
  const motoLabel = dati?.profilo.moto?.trim();
  const descParts = [
    motoLabel,
    km > 0 ? `${km.toLocaleString('it-IT')} km registrati` : null,
    badge,
    'Garage 3D interattivo su MotoGarage',
  ].filter(Boolean);

  return {
    title: `${nome} · Garage 3D`,
    description: descParts.join(' · '),
    robots: { index: true, follow: true },
    openGraph: {
      title: `${nome} · ${km > 0 ? `${km} km · ` : ''}MotoGarage`,
      description: descParts.join(' · '),
      type: 'website',
      url: `${SITE_URL.replace(/\/$/, '')}/garage/${encodeURIComponent(username)}`,
      images: [{ url: `${SITE_URL.replace(/\/$/, '')}/og-motogarage.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nome} · Garage 3D MotoGarage`,
      description: descParts.join(' · '),
    },
  };
}

export default async function PaginaGaragePubblico({ params }: Props) {
  const { username } = await params;
  const dati = await caricaGaragePubblico(username);
  if (!dati) notFound();

  return (
    <GaragePubblico
      username={dati.profilo.username ?? username}
      profilo={dati.profilo}
      moto={dati.moto}
      stats={dati.stats}
      vetrinaAnteprima={dati.vetrinaAnteprima}
    />
  );
}
