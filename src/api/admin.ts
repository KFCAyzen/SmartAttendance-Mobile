import type { Absence, AbsenceStatus } from './absences';
import { api } from './client';
import type { Leave, LeaveStatus, LeaveType } from './leaves';
import type { UserRole } from './shared-types.generated';

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
  user?: AdminUserSummary;
}

export interface AdminAbsence extends Absence {
  user?: AdminUserSummary;
}

// Enum Prisma synchronisé depuis le backend (npm run sync:types).
// NB : l'ancien alias local incluait un rôle MANAGER qui n'existe pas en base.
export type { UserRole } from './shared-types.generated';

export interface AdminEmployee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  isActive: boolean;
  isPending: boolean;
  mustChangePassword?: boolean;
  team?: { id: string; name: string } | null;
  site?: { id: string; name: string } | null;
  _count?: { attendances: number };
}

export interface AdminPresencePoint {
  date: string;
  onTime: number;
  late: number;
}

export type EmployeeAssignment = 'this' | 'unassigned' | 'other';

export async function getEmployees(
  page = 1,
  limit = 20,
  search?: string,
  department?: string,
  siteId?: string,
  assignment?: EmployeeAssignment,
  role?: string,
  status?: string,
): Promise<PagedResponse<AdminEmployee>> {
  const { data } = await api.get<PagedResponse<AdminEmployee>>('/admin/employees', {
    params: {
      page,
      limit,
      search: search || undefined,
      department: department || undefined,
      siteId: siteId || undefined,
      assignment: assignment || undefined,
      role: role && role !== 'all' ? role : undefined,
      status: status && status !== 'all' ? status : undefined,
    },
  });
  return data;
}

/** Liste distincte des départements (filtres) — endpoint léger, évite de récupérer les employés. */
export async function getDepartments(): Promise<string[]> {
  const { data } = await api.get<string[]>('/admin/departments');
  return data;
}

export interface CreateEmployeeInput {
  email: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  teamId?: string | null;
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

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  teamId?: string | null;
  role?: 'EMPLOYEE' | 'HR' | 'ADMIN';
  /** Bascule actif/inactif (le back garde l'historique de pointage). */
  isActive?: boolean;
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<AdminEmployee> {
  const { data } = await api.put<AdminEmployee>(`/admin/employees/${id}`, input);
  return data;
}

/** Suppression définitive (réservée ADMIN côté serveur). */
export async function deleteEmployee(id: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/admin/employees/${id}`);
  return data;
}

/** Valide un employé en attente (isPending → false). */
export async function validateEmployee(id: string): Promise<AdminEmployee> {
  const { data } = await api.post<AdminEmployee>(`/admin/employees/${id}/validate`);
  return data;
}

/** Réinitialise le mot de passe : renvoie un mot de passe temporaire à transmettre. */
export async function resetEmployeePassword(
  id: string,
): Promise<{ temporaryPassword: string }> {
  const { data } = await api.post<{ success: boolean; temporaryPassword: string }>(
    `/admin/users/${id}/reset-password`,
  );
  return data;
}

// ── Profil employé (fiche détaillée + statistiques) ─────────────────────────
export interface EmployeeProfileStats {
  totalCheckIns: number;
  totalCheckOuts: number;
  totalHours: number;
  lateCount: number;
  absences: number;
  attendanceScore: number;
}

export interface EmployeeProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  hireDate?: string | null;
  address?: string | null;
  bio?: string | null;
  gender?: string | null;
  educationLevel?: string | null;
  emergencyContact?: string | null;
  photoUrl?: string | null;
  team?: { id: string; name: string } | null;
  site?: { id: string; name: string } | null;
  createdAt?: string;
  stats: EmployeeProfileStats;
}

export interface UpdateEmployeeProfileInput {
  position?: string | null;
  phone?: string | null;
  department?: string | null;
  dateOfBirth?: string | null;
  hireDate?: string | null;
  address?: string | null;
  bio?: string | null;
  gender?: string | null;
  educationLevel?: string | null;
  emergencyContact?: string | null;
}

export async function getEmployeeProfile(id: string): Promise<EmployeeProfile> {
  const { data } = await api.get<EmployeeProfile>(`/employees/${id}/profile`);
  return data;
}

export async function updateEmployeeProfile(
  id: string,
  input: UpdateEmployeeProfileInput,
): Promise<{ success: boolean }> {
  const { data } = await api.patch<{ success: boolean }>(`/employees/${id}/profile`, input);
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

// ── Analytics dédiées structure SCHOOL (assiduité élèves) ────────────────────
export interface SchoolOverview {
  totalStudents: number;
  activeStudents: number;
  presentToday: number;
  absentToday: number;
  presentRate: number;
  absenceRate: number;
  absencesPeriod: number;
  chronicAbsenteesCount: number;
  chronicThreshold: number;
}

export interface SchoolPresencePoint {
  date: string;
  present: number;
  absent: number;
}

export interface SchoolClassBreakdown {
  teamId: string | null;
  team: string | null;
  studentCount: number;
  presentToday: number;
  absentToday: number;
  absenceRate: number;
}

export interface SchoolAbsenteeStudent {
  userId: string;
  name: string;
  team: string | null;
  photoUrl?: string | null;
  absenceCount: number;
  lastAbsenceDate: string | null;
}

export interface SchoolAbsenteeismList {
  threshold: number;
  days: number;
  students: SchoolAbsenteeStudent[];
}

export async function getSchoolOverview(days = 30): Promise<SchoolOverview> {
  const { data } = await api.get<SchoolOverview>('/admin/analytics/school-overview', {
    params: { days },
  });
  return data;
}

export async function getSchoolPresenceTrend(days = 30): Promise<SchoolPresencePoint[]> {
  const { data } = await api.get<SchoolPresencePoint[]>('/admin/analytics/school-presence', {
    params: { days },
  });
  return data;
}

export async function getSchoolClassBreakdown(days = 30): Promise<SchoolClassBreakdown[]> {
  const { data } = await api.get<SchoolClassBreakdown[]>('/admin/analytics/school-classes', {
    params: { days },
  });
  return data;
}

export async function getSchoolAbsenteeismList(
  days = 30,
  threshold = 3,
  limit = 20,
): Promise<SchoolAbsenteeismList> {
  const { data } = await api.get<SchoolAbsenteeismList>('/admin/analytics/school-absenteeism', {
    params: { days, threshold, limit },
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

/** Approuve un appareil en attente (PENDING → ACTIVE). Réservé ADMIN. */
export async function approveDevice(id: string): Promise<AdminDevice> {
  const { data } = await api.post<AdminDevice>(`/admin/devices/${id}/approve`);
  return data;
}

/** Révoque un appareil (→ REVOKED). Réservé ADMIN. */
export async function revokeDevice(id: string): Promise<AdminDevice> {
  const { data } = await api.post<AdminDevice>(`/admin/devices/${id}/revoke`);
  return data;
}

// ── Demandes de changement de photo de référence ────────────────────────────
export interface PhotoRequest {
  /** id = userId du demandeur. */
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string | null;
  newPhotoUrl?: string | null;
}

export async function getPhotoRequests(): Promise<PhotoRequest[]> {
  const { data } = await api.get<{ requests: PhotoRequest[] }>('/admin/photo-requests');
  return data.requests ?? [];
}

/** Valide la nouvelle photo (devient la photo de référence). Réservé ADMIN. */
export async function approvePhotoRequest(userId: string): Promise<{ success?: boolean }> {
  const { data } = await api.post<{ success?: boolean }>('/admin/photo-requests/approve', {
    userId,
  });
  return data;
}

/** Rejette la demande de nouvelle photo. Réservé ADMIN. */
export async function rejectPhotoRequest(userId: string): Promise<{ success?: boolean }> {
  const { data } = await api.post<{ success?: boolean }>('/admin/photo-requests/reject', {
    userId,
  });
  return data;
}

// ── Équipes ─────────────────────────────────────────────────────────────────
export interface AdminTeam {
  id: string;
  name: string;
  description?: string | null;
  managerId?: string | null;
  isActive?: boolean;
  manager?: { id: string; firstName: string; lastName: string } | null;
  _count?: { members: number };
}

export interface CreateTeamInput {
  name: string;
  description?: string | null;
  managerId?: string | null;
}

export type UpdateTeamInput = Partial<CreateTeamInput> & { isActive?: boolean };

export async function getTeams(): Promise<AdminTeam[]> {
  const { data } = await api.get<AdminTeam[]>('/admin/teams');
  return data;
}

export async function createTeam(input: CreateTeamInput): Promise<AdminTeam> {
  const { data } = await api.post<AdminTeam>('/admin/teams', input);
  return data;
}

export async function updateTeam(id: string, input: UpdateTeamInput): Promise<AdminTeam> {
  const { data } = await api.put<AdminTeam>(`/admin/teams/${id}`, input);
  return data;
}

export async function deleteTeam(id: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/admin/teams/${id}`);
  return data;
}

// ── Historique admin (pointages & congés, tous employés) ────────────────────
export interface AdminAttendanceRow {
  id: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  hoursWorked?: number | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string | null;
  } | null;
}

export async function getAdminAttendances(limit = 100): Promise<AdminAttendanceRow[]> {
  const { data } = await api.get<AdminAttendanceRow[]>('/admin/attendances', {
    params: { limit },
  });
  return data;
}

export interface AdminLeaveRow {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  reason?: string | null;
  createdAt?: string;
  user?: { name: string; email: string } | null;
}

export async function getAdminLeaves(status?: string): Promise<AdminLeaveRow[]> {
  const { data } = await api.get<AdminLeaveRow[]>('/admin/leaves', {
    params: { status: status && status !== 'all' ? status : undefined },
  });
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
