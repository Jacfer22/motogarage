const MESSAGGIO_MANCANTE = 'Configurazione server incompleta. Aggiungi su Vercel (Settings → Environment Variables) e in .env.local:';

function leggiEnv(...nomi: string[]): string {
  for (const nome of nomi) {
    const valore = process.env[nome]?.trim();
    if (valore) return valore;
  }
  return '';
}

export function supabaseUrlServer(): string {
  return leggiEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL');
}

export function supabaseAnonKey(): string {
  return leggiEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
}

export function supabaseServiceRoleKey(): string {
  return leggiEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_SERVICE_ROLE',
    'SERVICE_ROLE_KEY',
  );
}

export function huggingFaceToken(): string {
  return leggiEnv('HUGGINGFACE_TOKEN', 'HF_TOKEN');
}

export function verificaConfigServer(): void {
  const mancanti: string[] = [];
  if (!supabaseUrlServer()) mancanti.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey()) mancanti.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!supabaseServiceRoleKey()) mancanti.push('SUPABASE_SERVICE_ROLE_KEY');
  if (mancanti.length > 0) {
    throw new Error(`${MESSAGGIO_MANCANTE} ${mancanti.join(', ')}`);
  }
}

export function verificaConfigGenerazione(): void {
  verificaConfigServer();
  if (!huggingFaceToken()) {
    throw new Error(`${MESSAGGIO_MANCANTE} HUGGINGFACE_TOKEN`);
  }
}

export function statoConfigServer() {
  return {
    supabaseUrl: !!supabaseUrlServer(),
    anonKey: !!supabaseAnonKey(),
    serviceRole: !!supabaseServiceRoleKey(),
    huggingFace: !!huggingFaceToken(),
    ambiente: process.env.NODE_ENV ?? 'unknown',
    variabiliServiceRole: {
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY?.trim(),
      SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE?.trim(),
      SERVICE_ROLE_KEY: !!process.env.SERVICE_ROLE_KEY?.trim(),
    },
  };
}
