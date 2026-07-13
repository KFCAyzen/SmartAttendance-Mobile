import { api } from './client';

// Contexte fonctionnel de l'instance : ENTERPRISE (employés) ou SCHOOL
// (étudiants). Endpoint public côté backend — lisible avant login.
export type AppContext = 'ENTERPRISE' | 'SCHOOL';

export async function fetchAppContext(): Promise<AppContext> {
  const { data } = await api.get<{ context?: string }>('/config/app-context');
  return data?.context === 'SCHOOL' ? 'SCHOOL' : 'ENTERPRISE';
}
