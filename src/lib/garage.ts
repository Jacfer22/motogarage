export type StatoMoto = 'bozza' | 'in_attesa' | 'elaborazione' | 'pronto' | 'errore';
export type FormatoModello = 'glb' | 'gltf' | 'ply' | 'splat' | 'ksplat';

export interface GarageMoto {
  id: string;
  utente_id: string;
  marca: string;
  modello: string;
  anno: number | null;
  colore_primario: string | null;
  colore_secondario: string | null;
  foto_sx_url: string | null;
  foto_dx_url: string | null;
  glb_url: string | null;
  model_url?: string | null;
  model_format?: FormatoModello | null;
  stato: StatoMoto;
  task_id: string | null;
  progress?: number | null;
  errore: string | null;
  provider?: string | null;
  is_public?: boolean;
  categoria?: string | null;
  scheda_modifiche?: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  foto_sx_signed_url?: string | null;
  foto_dx_signed_url?: string | null;
}

export function nomeMoto(moto: Pick<GarageMoto, 'marca' | 'modello'>): string {
  return `${moto.marca} ${moto.modello}`.trim();
}

export function urlModello(
  moto: Pick<GarageMoto, 'model_url' | 'glb_url'> & { updated_at?: string },
  cacheBust = true,
): string | null {
  const base = moto.model_url || moto.glb_url || null;
  if (!base || !cacheBust) return base;
  const stamp = moto.updated_at ? new Date(moto.updated_at).getTime() : Date.now();
  const separatore = base.includes('?') ? '&' : '?';
  return `${base}${separatore}v=${stamp}`;
}

export function formatoModello(moto: Pick<GarageMoto, 'model_format' | 'model_url' | 'glb_url'>): FormatoModello {
  const url = urlModello(moto)?.toLowerCase().split('?')[0] ?? '';
  if (url.endsWith('.ply')) return 'ply';
  if (url.endsWith('.splat')) return 'splat';
  if (url.endsWith('.ksplat')) return 'ksplat';
  if (url.endsWith('.gltf')) return 'gltf';
  if (moto.model_format) return moto.model_format;
  return 'glb';
}

export function statoMotoLabel(stato: StatoMoto, provider?: string | null): string {
  if (stato === 'pronto') return 'Gemello digitale pronto';
  if (stato === 'in_attesa' && provider === 'in-attesa-approvazione') return 'In attesa di approvazione';
  if (stato === 'in_attesa') return 'In coda';
  if (stato === 'elaborazione') return 'Generazione 3D in corso';
  if (stato === 'errore') return 'Da revisionare';
  return 'Foto caricate';
}

export function dataMoto(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function isGaussianSplat(moto: Pick<GarageMoto, 'model_format' | 'model_url' | 'glb_url'>): boolean {
  const formato = formatoModello(moto);
  return formato === 'ply' || formato === 'splat' || formato === 'ksplat';
}
