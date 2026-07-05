import { api } from './client';
import type { ApiNotification } from './shared-types.generated';

// Types synchronisés depuis le backend (npm run sync:types).
export type { NotificationType } from './shared-types.generated';
export type Notification = ApiNotification;

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function listNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>('/notifications', {
    params: { page, limit },
  });
  return data;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await api.patch<Notification>(`/notifications/${id}`);
  return data;
}

export async function markAllRead(): Promise<void> {
  await api.post('/notifications/mark-all-read');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
