import axios, { AxiosError, type AxiosInstance } from 'axios';

import { clearAuth, getItem, StorageKeys } from '../lib/secure-storage';
import type { ApiError } from './types';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001';

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getItem(StorageKeys.AccessToken);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      await clearAuth();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function humanizeApiError(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const data = error.response?.data;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    if (error.code === 'ECONNABORTED') return 'La requête a expiré. Vérifiez votre connexion.';
    if (error.message === 'Network Error') return 'Connexion réseau indisponible.';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Erreur inconnue';
}
