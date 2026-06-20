import axios, { AxiosError, type AxiosInstance } from 'axios';
import i18n from '../i18n';

import { getItem, setItem, StorageKeys } from '../lib/secure-storage';
import { API_BASE_URL } from './base-url';
import type { ApiError } from './types';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = await getItem(StorageKeys.AccessToken);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Récupérer le token CSRF du cookie si disponible
  const csrfToken = await getItem(StorageKeys.CsrfToken);
  if (csrfToken) {
    config.headers.set('x-csrf-token', csrfToken);
  }
  
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => {
    // Stocker le token CSRF si présent dans les headers
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken) {
      setItem(StorageKeys.CsrfToken, csrfToken).catch(() => {});
    }
    return response;
  },
  (error: AxiosError<ApiError>) => {
    const url = error.config?.url ?? '';
    // Don't trigger global logout on login endpoint — it has its own error handling.
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
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
    if (error.code === 'ECONNABORTED') return i18n.t('errors.timeout');
    if (error.message === 'Network Error') return i18n.t('errors.network');
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return i18n.t('errors.unknown');
}

export function isNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    error.message === 'Network Error'
  );
}
