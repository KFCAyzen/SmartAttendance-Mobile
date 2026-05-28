import { api } from './client';
import type { LoginResponse, User } from './types';

export async function getCsrfToken(): Promise<string> {
  const { data } = await api.get<{ token: string }>('/csrf/token');
  return data.token;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}
