import { api } from './client';

export type StructureType = 'ENTERPRISE' | 'SCHOOL';

export interface Structure {
  id: string;
  name: string;
  type: StructureType;
  description?: string | null;
  city?: string | null;
  attendanceReminderTime: string;
  workEndTime: string;
  lateToleranceMinutes: number;
  isActive: boolean;
  createdAt: string;
  _count?: { members: number; teams: number; sites: number };
}

// Structures possédées par l'admin connecté (liste pour le sélecteur).
export async function getStructures(): Promise<Structure[]> {
  const { data } = await api.get<Structure[]>('/structures');
  return data;
}

// Structure active de la requête courante (résolue via l'en-tête X-Structure-Id).
export async function getActiveStructure(): Promise<Structure | null> {
  const { data } = await api.get<{ structure: Structure | null }>('/structures/active');
  return data.structure;
}
