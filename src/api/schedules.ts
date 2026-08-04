import { api } from './client';

export interface Schedule {
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  workDays: string | number[];
  hoursPerDay: number;
}

// self=1 : "mon" horaire quel que soit le rôle du compte connecté (un ADMIN
// qui prévisualise sa propre vue doit voir le même repli par défaut qu'un
// élève/employé, pas la liste de gestion complète de la structure).
export async function getMySchedule(): Promise<Schedule[]> {
  const { data } = await api.get<Schedule[]>('/schedules', { params: { self: 1 } });
  return data;
}
