import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  deleteNotification,
  listNotifications,
  markAllRead,
  markNotificationRead,
  type Notification,
} from '../api/notifications';
import { useAuthStore } from '../stores/auth.store';

const root = ['notifications'] as const;

/** Lightweight polling hook for the home header badge. Refetches every 60s in foreground. */
export function useUnreadCount() {
  const isAuth = useAuthStore((s) => s.status === 'authenticated');
  const query = useQuery({
    queryKey: [...root, 'page', 1],
    queryFn: () => listNotifications(1, 20),
    enabled: isAuth,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
  const count = (query.data?.data ?? []).filter((n) => !n.isRead).length;
  return { count, isLoading: query.isLoading };
}

/** Full list with infinite scroll for the dedicated screen. */
export function useNotificationsList() {
  return useInfiniteQuery({
    queryKey: [...root, 'list'],
    queryFn: ({ pageParam = 1 }) => listNotifications(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
  });
}

export function useNotificationActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: root });

  const read = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: root });
      // Optimistically flip isRead in any cached pages.
      const snapshots = queryClient.getQueriesData<{ data?: Notification[] } | { pages?: { data: Notification[] }[] }>({
        queryKey: root,
      });
      for (const [key, value] of snapshots) {
        if (!value) continue;
        if ('pages' in value && value.pages) {
          queryClient.setQueryData(key, {
            ...value,
            pages: value.pages.map((p) => ({
              ...p,
              data: p.data.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
            })),
          });
        } else if ('data' in value && value.data) {
          queryClient.setQueryData(key, {
            ...value,
            data: value.data.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          });
        }
      }
    },
    onSettled: invalidate,
  });

  const readAll = useMutation({ mutationFn: markAllRead, onSettled: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => deleteNotification(id), onSettled: invalidate });

  return { read, readAll, remove };
}
