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
  // true se le variabili NEXT_PUBLIC_SUPABASE_* non sono configurate
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
      setStato((s) => ({ ...s, user: null, profilo: null, loading: false, nonConfigurato: true }));
      return;
    }

    async function caricaProfilo(user: User | null) {
      if (!user) {
        setStato((s) => ({ ...s, user: null, profilo: null, loading: false, nonConfigurato: false }));
        return;
      }
      const { data } = await supabase!
        .from('profiles')
        .select('username, moto, categoria_moto, avatar_url, is_pro, is_admin, bio, moto_tipo, moto_colore_primario, moto_colore_secondario, moto_accessori')
        .eq('id', user.id)
        .single();
      setStato((s) => ({
        ...s,
        user,
        profilo: (data as Profilo) ?? null,
        loading: false,
        nonConfigurato: false,
      }));
    }

    // Session timeout: se la tab è rimasta chiusa/nascosta > 10 minuti, fa il logout.
    const TIMEOUT_MS = 10 * 60 * 1000;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem('gs_tab_hidden', Date.now().toString());
      } else {
        const val = localStorage.getItem('gs_tab_hidden');
        if (val && Date.now() - Number(val) > TIMEOUT_MS) {
          supabase!.auth.signOut();
        }
        localStorage.removeItem('gs_tab_hidden');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const ricaricaProfilo = () => {
      supabase.auth.getSession().then(({ data }) => {
        caricaProfilo(data.session?.user ?? null);
      });
    };

    setStato((s) => ({ ...s, ricaricaProfilo }));

    supabase.auth.getSession().then(({ data }) => {
      caricaProfilo(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, session) => {
      caricaProfilo(session?.user ?? null);
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
