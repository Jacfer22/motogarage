import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ReelGarageCapture from '@/components/ReelGarageCapture';
import type { GarageMoto } from '@/lib/garage';

interface Props {
  searchParams: Promise<{ user?: string }>;
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}

/** Pagina fullscreen solo per cattura reel marketing — niente chrome. */
export default async function PaginaReelGarage({ searchParams }: Props) {
  const { user = 'jacfer22' } = await searchParams;
  const supabase = client();
  if (!supabase) notFound();

  const { data: profilo } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', user)
    .maybeSingle();
  if (!profilo) notFound();

  const { data } = await supabase
    .from('moto')
    .select('*')
    .eq('utente_id', profilo.id)
    .eq('is_public', true)
    .eq('stato', 'pronto')
    .or('model_url.not.is.null,glb_url.not.is.null')
    .order('created_at', { ascending: false })
    .limit(1);

  const moto = (data ?? []) as GarageMoto[];
  if (moto.length === 0) notFound();

  return <ReelGarageCapture username={profilo.username ?? user} moto={moto} />;
}
