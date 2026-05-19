import { api } from './client';
import type { User } from './types';

export interface PhotoResponse {
  photoUrl: string | null;
  photoChangeRequested?: boolean;
  newPhotoUrl?: string | null;
}

export interface SetPhotoResponse {
  success: boolean;
  photoUrl: string;
}

export interface RequestPhotoChangeResponse {
  success: boolean;
  autoApproved: boolean;
  photoUrl?: string;
}

export async function getMyPhoto(): Promise<PhotoResponse> {
  const { data } = await api.get<PhotoResponse>('/users/me/photo');
  return data;
}

export async function setMyPhoto(photoBase64: string): Promise<SetPhotoResponse> {
  const { data } = await api.put<SetPhotoResponse>('/users/me/photo', { photo: photoBase64 });
  return data;
}

export async function requestPhotoChange(
  photoBase64: string,
): Promise<RequestPhotoChangeResponse> {
  const { data } = await api.post<RequestPhotoChangeResponse>('/users/me/photo/request-change', {
    newPhoto: photoBase64,
  });
  return data;
}

export async function getMyProfile(): Promise<User> {
  const { data } = await api.get<User>('/users/me/profile');
  return data;
}

/**
 * Backend stores photos under `uploads/photos/` and serves them at `/uploads/`.
 * Returned photoUrl is e.g. `/photos/abc.jpg`, so the absolute URL is
 * `${API}/uploads${photoUrl}`.
 */
export function buildPhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  const baseURL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001').replace(/\/$/, '');
  const path = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${baseURL}/uploads${path}`;
}
