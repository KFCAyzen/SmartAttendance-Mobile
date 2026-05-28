import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getCsrfToken, getMe, login as loginRequest } from '../api/auth';
import { setItem, StorageKeys } from '../lib/secure-storage';
import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const deviceStatus = useAuthStore((s) => s.deviceStatus);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const verifyDevice = useAuthStore((s) => s.verifyDevice);
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const csrfToken = await getCsrfToken();
      await setItem(StorageKeys.CsrfToken, csrfToken);
      const { user, accessToken } = await loginRequest(email, password);
      return { user, accessToken };
    },
    onSuccess: async ({ user, accessToken }) => {
      await setSession(accessToken, user);
    },
  });

  async function logout() {
    await clearSession();
    queryClient.clear();
  }

  async function refreshMe() {
    if (!useAuthStore.getState().accessToken) return null;
    const me = await getMe();
    const token = useAuthStore.getState().accessToken;
    if (token) await setSession(token, me);
    return me;
  }

  return {
    status,
    user,
    deviceStatus,
    isAuthenticated: status === 'authenticated',
    isHydrating:
      status === 'idle' || status === 'loading' || status === 'verifying_device',
    login: loginMutation,
    logout,
    refreshMe,
    verifyDevice,
  };
}
