import { api } from './client';

// Contexte fonctionnel de l'instance : ENTERPRISE (employés) ou SCHOOL
// (étudiants). Endpoint public côté backend — lisible avant login.
export type AppContext = 'ENTERPRISE' | 'SCHOOL';

export async function fetchAppContext(): Promise<AppContext> {
  const { data } = await api.get<{ context?: string }>('/config/app-context');
  return data?.context === 'SCHOOL' ? 'SCHOOL' : 'ENTERPRISE';
}

// Horaire par défaut de l'instance : s'applique à tout le monde tant qu'aucun
// horaire dédié n'existe (c'est LE seul horaire en mode école). Lecture
// ADMIN/HR, écriture ADMIN.
export interface DefaultSchedule {
  startTime: string;
  endTime: string;
  lateToleranceMinutes: number;
}

export async function fetchDefaultSchedule(): Promise<DefaultSchedule> {
  const { data } = await api.get<DefaultSchedule>('/config/default-schedule');
  return data;
}

export async function updateDefaultSchedule(input: DefaultSchedule): Promise<DefaultSchedule> {
  const { data } = await api.put<DefaultSchedule>('/config/default-schedule', input);
  return data;
}
