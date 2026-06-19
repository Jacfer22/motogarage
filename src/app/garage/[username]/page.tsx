import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import GaragePubblico from '@/components/GaragePubblico';
import type { GarageMoto } from '@/lib/garage';

interface Props {
  params: Promise<{ username: string }>;
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Garage di ${username}`,
    description: `Visita il garage digitale di ${username} su MotoGarage.`,
    robots: { index: true, follow: true },
  };
}

export default async function PaginaGaragePubblico({ params }: Props) {
  const { username } = await params;
  const supabase = client();
  if (!supabase) notFound();

  const { data: profilo } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle();
  if (!profilo) notFound();

  const { data } = await supabase
    .from('moto')
    .select('*')
    .eq('utente_id', profilo.id)
    .eq('is_public', true)
    .eq('stato', 'pronto')
    .or('model_url.not.is.null,glb_url.not.is.null')
    .order('created_at', { ascending: false });

  return <GaragePubblico username={profilo.username ?? username} moto={(data ?? []) as GarageMoto[]} />;
}
