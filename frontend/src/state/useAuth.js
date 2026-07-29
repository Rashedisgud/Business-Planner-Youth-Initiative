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

  /** Changes the password of whoever is currently signed in. */
  const changePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  /**
   * For someone locked out entirely. Supabase mails a link that signs them in,
   * and the recovery event below drops them straight into changing it.
   */
  const requestPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#recover`,
    });
    if (error) throw error;
  }, []);

  return {
    user: session?.user ?? null,
    accessToken: session?.access_token ?? null,
    loading,
    signUp,
    signIn,
    signOut,
    changePassword,
    requestPasswordReset,
  };
}
