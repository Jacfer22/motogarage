'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export interface Profilo {
  username: string | null;
  moto: string | null;
  categoria_moto: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  is_admin: boolean;
  bio: string | null;
  moto_tipo: string | null;
  moto_colore_primario: string | null;
  moto_colore_secondario: string | null;
  moto_accessori: string[] | null;
}

interface AuthState {
  user: User | null;
  profilo: Profilo | null;
  loading: boolean;
  nonConfigurato: boolean;
  ricaricaProfilo: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profilo: null,
  loading: true,
  nonConfigurato: false,
  ricaricaProfilo: () => {},
});

const TAB_HIDDEN_KEY = 'motogarage_tab_hidden';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [stato, setStato] = useState<AuthState>({
    user: null,
    profilo: null,
    loading: true,
    nonConfigurato: false,
    ricaricaProfilo: () => {},
  });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setStato((attuale) => ({ ...attuale, user: null, profilo: null, loading: false, nonConfigurato: true }));
      return;
    }

    async function caricaProfilo(user: User | null) {
      if (!user) {
        setStato((attuale) => ({ ...attuale, user: null, profilo: null, loading: false, nonConfigurato: false }));
        return;
      }
      const { data } = await supabase!
        .from('profiles')
        .select('username, moto, categoria_moto, avatar_url, is_pro, is_admin, bio, moto_tipo, moto_colore_primario, moto_colore_secondario, moto_accessori')
        .eq('id', user.id)
        .single();
      setStato((attuale) => ({
        ...attuale,
        user,
        profilo: (data as Profilo) ?? null,
        loading: false,
        nonConfigurato: false,
      }));
    }

    const timeoutMs = 10 * 60 * 1000;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem(TAB_HIDDEN_KEY, Date.now().toString());
        return;
      }
      const nascostaDa = localStorage.getItem(TAB_HIDDEN_KEY);
      if (nascostaDa && Date.now() - Number(nascostaDa) > timeoutMs) {
        supabase.auth.signOut();
      }
      localStorage.removeItem(TAB_HIDDEN_KEY);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const ricaricaProfilo = () => {
      supabase.auth.getSession().then(({ data }) => caricaProfilo(data.session?.user ?? null));
    };
    setStato((attuale) => ({ ...attuale, ricaricaProfilo }));

    supabase.auth.getSession().then(({ data }) => caricaProfilo(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, sessione) => {
      caricaProfilo(sessione?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <AuthContext.Provider value={stato}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
