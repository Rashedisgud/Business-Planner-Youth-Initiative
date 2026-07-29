import { useCallback, useState } from 'react';
import { api } from '../api/client.js';

const KEY = 'byi_admin_password';

export function useAdminAuth() {
  const [password, setPassword] = useState(() => localStorage.getItem(KEY));

  const verify = useCallback(async (candidate) => {
    await api.verifyAdminPassword(candidate);
    localStorage.setItem(KEY, candidate);
    setPassword(candidate);
  }, []);

  const forget = useCallback(() => {
    localStorage.removeItem(KEY);
    setPassword(null);
  }, []);

  return { password, isUnlocked: !!password, verify, forget };
}
