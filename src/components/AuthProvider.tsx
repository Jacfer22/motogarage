'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export interface Profilo {
  username: string | null;
  moto: string | null;
  is_pro: boolean;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  profilo: Profilo | null;
  loading: boolean;
  // true se le variabili NEXT_PUBLIC_SUPABASE_* non sono configurate
  nonConfigurato: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profilo: null,
  loading: true,
  nonConfigurato: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [stato, setStato] = useState<AuthState>({
    user: null,
    profilo: null,
    loading: true,
    nonConfigurato: false,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setStato({ user: null, profilo: null, loading: false, nonConfigurato: true });
      return;
    }

    async function caricaProfilo(user: User | null) {
      if (!user) {
        setStato({ user: null, profilo: null, loading: false, nonConfigurato: false });
        return;
      }
      const { data } = await supabase!
        .from('profiles')
        .select('username, moto, is_pro, is_admin')
        .eq('id', user.id)
        .single();
      setStato({
        user,
        profilo: (data as Profilo) ?? null,
        loading: false,
        nonConfigurato: false,
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      caricaProfilo(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, session) => {
      caricaProfilo(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={stato}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
