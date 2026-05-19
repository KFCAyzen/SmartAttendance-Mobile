import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getMe, login as loginRequest } from '../api/auth';
import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
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
    isAuthenticated: status === 'authenticated',
    isHydrating: status === 'idle' || status === 'loading',
    login: loginMutation,
    logout,
    refreshMe,
  };
}
