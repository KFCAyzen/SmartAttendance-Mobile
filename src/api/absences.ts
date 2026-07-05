import { api } from './client';
import type { AbsenceStatus, AbsenceType } from './shared-types.generated';

// Enums Prisma synchronisés depuis le backend (npm run sync:types).
export type { AbsenceStatus, AbsenceType } from './shared-types.generated';

export interface Absence {
  id: string;
  userId: string;
  type: AbsenceType;
  status: AbsenceStatus;
  date: string;
  reason?: string | null;
  justificationUrl?: string | null;
  adminComment?: string | null;
  duration?: string | null;
  createdAt: string;
}

interface PagedResponse<T> {
  data?: T[];
  items?: T[];
  absences?: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

export interface AbsenceQuery {
  page?: number;
  limit?: number;
  status?: AbsenceStatus;
  startDate?: string;
  endDate?: string;
}

export async function listAbsences(query: AbsenceQuery = {}): Promise<PagedResponse<Absence>> {
  const { data } = await api.get<PagedResponse<Absence>>('/absences', { params: query });
  return data;
}

export interface JustifyAbsencePayload {
  reason: string;
  fileUri: string;
  fileName: string;
  fileMime: string;
}

export async function justifyAbsence(id: string, payload: JustifyAbsencePayload): Promise<Absence> {
  const form = new FormData();
  // React Native's FormData accepts the { uri, name, type } shape for file uploads.
  form.append('file', {
    uri: payload.fileUri,
    name: payload.fileName,
    type: payload.fileMime,
  } as unknown as Blob);
  form.append('reason', payload.reason);

  const { data } = await api.post<Absence>(`/absences/${id}/justify`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
