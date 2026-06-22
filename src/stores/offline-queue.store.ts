import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PendingCheckIn {
  id: string;
  deviceId: string;
  photoBase64: string;
  latitude?: number;
  longitude?: number;
  wifiSSID?: string;
  wifiBSSID?: string;
  timestamp: number;
  attempts: number;
}

interface OfflineQueueState {
  queue: PendingCheckIn[];
  add: (item: PendingCheckIn) => void;
  pop: () => void;
  clear: () => void;
  markAttempt: (id: string) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      queue: [],
      add: (item) => {
        set((state) => ({
          queue: state.queue.length > 0 ? state.queue : [item],
        }));
      },
      pop: () => {
        set((state) => ({ queue: state.queue.slice(1) }));
      },
      clear: () => {
        set({ queue: [] });
      },
      markAttempt: (id) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id ? { ...item, attempts: item.attempts + 1 } : item,
          ),
        }));
      },
    }),
    {
      name: 'sa.offline-checkin-queue',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
