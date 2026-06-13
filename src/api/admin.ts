import type { Absence, AbsenceStatus } from './absences';
import { api } from './client';
import type { Leave, LeaveStatus, LeaveType } from './leaves';

interface PagedResponse<T> {
  data?: T[];
  items?: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminPendingCounts {
  leaves: number;
  absences: number;
  devices: number;
  photos: number;
  total: number;
}

export interface AdminOverview {
  totalEmployees: number;
  activeEmployees: number;
  totalCheckIns: number;
  totalCheckOuts: number;
  lateArrivals: number;
  missingCheckouts: number;
  attendanceRate: number;
  punctualityRate: number;
  avgHoursPerDay: number;
  totalHours: number;
  avgCheckInsPerDay: number;
}

export interface AdminUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string | null;
}

export interface AdminLeave extends Omit<Leave, 'type' | 'status'> {
  type: LeaveType;
  status: LeaveStatus;
  days?: number;
  adminComment?: string | null;
  user?: AdminUserSummary;
}

export interface AdminAbsence extends Absence {
  user?: AdminUserSummary;
}

export type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface AdminEmployee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  isActive: boolean;
  isPending: boolean;
  team?: { id: string; name: string } | null;
  site?: { id: string; name: string } | null;
  _count?: { attendances: number };
}

export interface AdminPresencePoint {
  date: string;
  onTime: number;
  late: number;
}

export async function getEmployees(
  page = 1,
  limit = 20,
  search?: string,
  department?: string,
): Promise<PagedResponse<AdminEmployee>> {
  const { data } = await api.get<PagedResponse<AdminEmployee>>('/admin/employees', {
    params: { page, limit, search: search || undefined, department: department || undefined },
  });
  return data;
}

export interface CreateEmployeeInput {
  email: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  phone?: string;
  role?: 'EMPLOYEE' | 'HR' | 'ADMIN';
}

export interface CreatedEmployee extends AdminEmployee {
  /** Mot de passe temporaire à transmettre à l'employé (1re connexion). */
  tempPassword: string;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<CreatedEmployee> {
  const { data } = await api.post<CreatedEmployee>('/admin/employees', input);
  return data;
}

/** Présence en direct : statut du jour réel par employé. */
export type LivePresenceState = 'present' | 'late' | 'out' | 'leave' | 'absent' | 'pending';

export interface LivePresenceEntry {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  position?: string | null;
  department?: string | null;
  site?: string | null;
  state: LivePresenceState;
  since?: string | null;
}

export async function getLivePresence(): Promise<LivePresenceEntry[]> {
  const { data } = await api.get<LivePresenceEntry[]>('/admin/presence');
  return data;
}

/** Présence agrégée par date (taux de pointage à l'heure / en retard). */
export async function getAnalyticsPresence(days = 30): Promise<AdminPresencePoint[]> {
  const { data } = await api.get<AdminPresencePoint[]>('/admin/analytics/presence', {
    params: { days },
  });
  return data;
}

export async function getAdminPendingCounts(): Promise<AdminPendingCounts> {
  const { data } = await api.get<AdminPendingCounts>('/admin/pending-counts');
  return data;
}

export async function getAdminOverview(days = 30): Promise<AdminOverview> {
  const { data } = await api.get<AdminOverview>('/admin/analytics/overview', {
    params: { days },
  });
  return data;
}

export async function getPendingLeaves(page = 1, limit = 20): Promise<PagedResponse<AdminLeave>> {
  const { data } = await api.get<PagedResponse<AdminLeave>>('/admin/leave-requests', {
    params: { status: 'PENDING', page, limit },
  });
  return data;
}

export async function getPendingAbsences(
  page = 1,
  limit = 20,
): Promise<PagedResponse<AdminAbsence>> {
  const { data } = await api.get<PagedResponse<AdminAbsence>>('/admin/absences', {
    params: { status: 'PENDING', page, limit },
  });
  return data;
}

export async function approveLeave(id: string, adminId: string): Promise<AdminLeave> {
  const { data } = await api.post<AdminLeave>(`/admin/leave-requests/${id}/approve`, {
    adminId,
  });
  return data;
}

export async function rejectLeave(
  id: string,
  adminId: string,
  comment: string,
): Promise<AdminLeave> {
  const { data } = await api.post<AdminLeave>(`/admin/leave-requests/${id}/reject`, {
    adminId,
    comment,
  });
  return data;
}

export async function updateAbsenceStatus(
  id: string,
  status: AbsenceStatus,
  adminComment?: string,
): Promise<AdminAbsence> {
  const { data } = await api.patch<AdminAbsence>(`/admin/absences/${id}`, {
    status,
    adminComment,
  });
  return data;
}

// ── Planning (congés & absences du mois) ────────────────────────────────────
export interface PlanningEvent {
  emp: string;
  initials: string;
  type: string;
  tone: string;
  start: number;
  end: number;
}

export interface AdminPlanning {
  year: number;
  month: number; // 1-12
  daysInMonth: number;
  events: PlanningEvent[];
}

export async function getPlanning(year: number, month: number): Promise<AdminPlanning> {
  const { data } = await api.get<AdminPlanning>('/admin/planning', { params: { year, month } });
  return data;
}

export interface CreateLeaveInput {
  userId: string;
  type: LeaveType;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  reason?: string;
}

export async function createLeaveRequest(input: CreateLeaveInput): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>('/admin/leave-requests', input);
  return data;
}

// ── Rôles (effectifs par rôle) ──────────────────────────────────────────────
export interface RoleSummary {
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  members: number;
}

export async function getRoles(): Promise<RoleSummary[]> {
  const { data } = await api.get<RoleSummary[]>('/admin/roles');
  return data;
}

// ── Paramètres de pointage ──────────────────────────────────────────────────
export interface AdminSettings {
  faceThreshold: string;
  geofencing: boolean;
  workHours: string;
  strictDoubleCheckin: boolean;
  lateAlerts: boolean;
}

export async function getSettings(): Promise<AdminSettings> {
  const { data } = await api.get<AdminSettings>('/admin/settings');
  return data;
}

export async function updateSetting(
  key: keyof AdminSettings,
  value: string | boolean,
): Promise<AdminSettings> {
  const { data } = await api.put<AdminSettings>('/admin/settings', { key, value });
  return data;
}

// ── Sites & appareils ───────────────────────────────────────────────────────
export interface AdminSite {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  geofence: number;
  isActive?: boolean;
  status: string;
  wifiSSID?: string | null;
  wifiBSSID?: string | null;
  total: number;
  present: number;
  devices: number;
}

export async function getSites(): Promise<AdminSite[]> {
  const { data } = await api.get<AdminSite[]>('/admin/sites');
  return data;
}

export interface CreateSiteInput {
  name: string;
  address: string;
  city?: string;
  latitude: number;
  longitude: number;
  radius?: number;
  wifiSSID?: string;
  wifiBSSID?: string;
}

export async function createSite(input: CreateSiteInput): Promise<AdminSite> {
  const { data } = await api.post<AdminSite>('/admin/sites', input);
  return data;
}

export type UpdateSiteInput = Partial<CreateSiteInput> & { isActive?: boolean };

export async function updateSite(id: string, input: UpdateSiteInput): Promise<AdminSite> {
  const { data } = await api.put<AdminSite>(`/admin/sites/${id}`, input);
  return data;
}

export interface SiteMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string | null;
  department?: string | null;
  photoUrl?: string | null;
}

export async function getSiteMembers(siteId: string): Promise<SiteMember[]> {
  const { data } = await api.get<SiteMember[]>(`/admin/sites/${siteId}/members`);
  return data;
}

export async function setSiteMembers(siteId: string, userIds: string[]): Promise<{ count: number }> {
  const { data } = await api.put<{ count: number }>(`/admin/sites/${siteId}/members`, { userIds });
  return data;
}

export interface AdminDevice {
  id: string;
  deviceName: string;
  platform: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  lastUsedAt?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    site?: { name: string } | null;
  } | null;
}

export async function getDevices(): Promise<AdminDevice[]> {
  const { data } = await api.get<AdminDevice[]>('/admin/devices');
  return data;
}

// ── Analytics par département (présence) ────────────────────────────────────
export interface AdminDeptStat {
  department: string;
  count: number;
  onTime: number;
  late: number;
  onTimeRate: number;
  headcount: number;
  present: number;
}

export async function getAnalyticsDepartments(days = 30): Promise<AdminDeptStat[]> {
  const { data } = await api.get<AdminDeptStat[]>('/admin/analytics/departments', {
    params: { days },
  });
  return data;
}

// ── Rapports & export ───────────────────────────────────────────────────────
export interface ReportSummary {
  type: string;
  rows: number;
}

export async function getReports(days = 30): Promise<ReportSummary[]> {
  const { data } = await api.get<ReportSummary[]>('/admin/reports', { params: { days } });
  return data;
}

export interface ReportExport {
  type: string;
  title: string;
  filename: string;
  columns: string[];
  rows: string[][];
  csv: string;
}

export async function exportReport(type: string, days = 30): Promise<ReportExport> {
  const { data } = await api.get<ReportExport>(`/admin/reports/${type}/export`, {
    params: { days },
  });
  return data;
}
