import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /**
   * Supabase returns a session straight away when email confirmation is turned
   * off, and no session when it is on. Report which happened so the caller can
   * either close up or tell the person to go and check their inbox, rather than
   * hardcoding an assumption about how the project is configured.
   */
  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    user: session?.user ?? null,
    accessToken: session?.access_token ?? null,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
