import AsyncStorage from '@react-native-async-storage/async-storage';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import '../i18n';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useAuthStore } from '../stores/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'sa.query-cache',
});

export function Providers({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  useOfflineSync();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => focusManager.setFocused(state === 'active');
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
