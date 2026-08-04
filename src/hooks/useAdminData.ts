import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  approveDevice,
  approveLeave,
  approvePhotoRequest,
  createEmployee,
  createLeaveRequest,
  createSite,
  createTeam,
  deleteEmployee,
  deleteTeam,
  getAdminAttendances,
  getAdminLeaves,
  getEmployeeProfile,
  getPhotoRequests,
  getTeams,
  rejectPhotoRequest,
  resetEmployeePassword,
  revokeDevice,
  updateEmployeeProfile,
  updateTeam,
  validateEmployee,
  getAdminOverview,
  getAdminPendingCounts,
  getAnalyticsDepartments,
  getAnalyticsPresence,
  getDepartments,
  getDevices,
  getEmployees,
  getLivePresence,
  getPendingAbsences,
  getPendingLeaves,
  getPlanning,
  getReports,
  getRoles,
  getSettings,
  getSiteMembers,
  getSites,
  getSchoolOverview,
  getSchoolPresenceTrend,
  getSchoolClassBreakdown,
  getSchoolAbsenteeismList,
  rejectLeave,
  setSiteMembers,
  updateAbsenceStatus,
  updateEmployee,
  updateSetting,
  updateSite,
  type AdminSettings,
  type CreateEmployeeInput,
  type CreateLeaveInput,
  type CreateSiteInput,
  type CreateTeamInput,
  type EmployeeAssignment,
  type UpdateEmployeeInput,
  type UpdateEmployeeProfileInput,
  type UpdateSiteInput,
  type UpdateTeamInput,
} from "../api/admin";
import { fetchDefaultSchedule, updateDefaultSchedule, type DefaultSchedule } from "../api/config";
import { useAuthStore } from "../stores/auth.store";

const root = ["admin"] as const;

export function useIsAdmin() {
  return useAuthStore((s) => s.user?.role === "ADMIN" || s.user?.role === "HR");
}

// Horaire par défaut de l'instance (limite d'arrivée + fin de journée).
export function useDefaultSchedule() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "default-schedule"],
    queryFn: fetchDefaultSchedule,
    enabled: isAdmin,
  });
}

export function useUpdateDefaultSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DefaultSchedule) => updateDefaultSchedule(input),
    onSuccess: (data) => queryClient.setQueryData([...root, "default-schedule"], data),
  });
}

export function useAdminPendingCounts() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "pending-counts"],
    queryFn: getAdminPendingCounts,
    enabled: isAdmin,
    refetchInterval: 30_000,
  });
}

export function useAdminOverview(days = 30) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "overview", days],
    queryFn: () => getAdminOverview(days),
    enabled: isAdmin,
  });
}

export function useAdminPresence(days = 7) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "presence", days],
    queryFn: () => getAnalyticsPresence(days),
    enabled: isAdmin,
  });
}

// ── Analytics dédiées structure SCHOOL (assiduité élèves) ────────────────────
export function useSchoolOverview(days = 30) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "school-overview", days],
    queryFn: () => getSchoolOverview(days),
    enabled: isAdmin,
  });
}

export function useSchoolPresenceTrend(days = 30) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "school-presence", days],
    queryFn: () => getSchoolPresenceTrend(days),
    enabled: isAdmin,
  });
}

export function useSchoolClassBreakdown(days = 30) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "school-classes", days],
    queryFn: () => getSchoolClassBreakdown(days),
    enabled: isAdmin,
  });
}

export function useSchoolAbsenteeismList(days = 30, threshold = 3, limit = 20) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "school-absenteeism", days, threshold, limit],
    queryFn: () => getSchoolAbsenteeismList(days, threshold, limit),
    enabled: isAdmin,
  });
}

/** Présence en direct : statut du jour réel par employé (rafraîchi en continu). */
export function useLivePresence() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "live-presence"],
    queryFn: getLivePresence,
    enabled: isAdmin,
    refetchInterval: 30_000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...root, "employees"] });
      queryClient.invalidateQueries({ queryKey: [...root, "roles"] });
      queryClient.invalidateQueries({ queryKey: [...root, "live-presence"] });
    },
  });
}

function invalidateEmployees(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [...root, "employees"] });
  queryClient.invalidateQueries({ queryKey: [...root, "roles"] });
  queryClient.invalidateQueries({ queryKey: [...root, "live-presence"] });
  queryClient.invalidateQueries({ queryKey: [...root, "pending-counts"] });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeInput }) =>
      updateEmployee(id, input),
    onSuccess: () => invalidateEmployees(queryClient),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => invalidateEmployees(queryClient),
  });
}

export function useValidateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => validateEmployee(id),
    onSuccess: () => invalidateEmployees(queryClient),
  });
}

export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: (id: string) => resetEmployeePassword(id),
  });
}

export function useEmployeeProfile(id?: string) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "employee-profile", id],
    queryFn: () => getEmployeeProfile(id!),
    enabled: isAdmin && !!id,
  });
}

export function useUpdateEmployeeProfile(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEmployeeProfileInput) => updateEmployeeProfile(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...root, "employee-profile", id] });
      queryClient.invalidateQueries({ queryKey: [...root, "employees"] });
    },
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSiteInput) => createSite(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...root, "sites"] }),
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSiteInput }) => updateSite(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...root, "sites"] }),
  });
}

export function useSiteMembers(siteId: string | null) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "sites", siteId, "members"],
    queryFn: () => getSiteMembers(siteId as string),
    enabled: isAdmin && !!siteId,
  });
}

export function useSetSiteMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, userIds }: { siteId: string; userIds: string[] }) =>
      setSiteMembers(siteId, userIds),
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: [...root, "sites"] });
      queryClient.invalidateQueries({ queryKey: [...root, "sites", siteId, "members"] });
      queryClient.invalidateQueries({ queryKey: [...root, "employees"] });
      queryClient.invalidateQueries({ queryKey: [...root, "live-presence"] });
    },
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeaveInput) => createLeaveRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...root, "planning"] });
      queryClient.invalidateQueries({ queryKey: [...root, "live-presence"] });
    },
  });
}

export function useEmployees(
  search: string,
  department?: string,
  filters?: {
    siteId?: string;
    assignment?: EmployeeAssignment;
    role?: string;
    status?: string;
  },
) {
  const isAdmin = useIsAdmin();
  const siteId = filters?.siteId;
  const assignment = filters?.assignment;
  const role = filters?.role;
  const status = filters?.status;
  return useInfiniteQuery({
    queryKey: [
      ...root,
      "employees",
      search,
      department ?? "all",
      siteId ?? "all",
      assignment ?? "all",
      role ?? "all",
      status ?? "all",
    ],
    queryFn: ({ pageParam = 1 }) =>
      getEmployees(pageParam, 20, search, department, siteId, assignment, role, status),
    initialPageParam: 1,
    enabled: isAdmin,
    placeholderData: keepPreviousData,
    getNextPageParam: (last) => {
      const meta = last.meta ?? last.pagination;
      if (!meta) return undefined;
      const next = meta.page + 1;
      return next <= meta.totalPages ? next : undefined;
    },
  });
}

export function useEmployeeDepartments() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "departments-list"],
    queryFn: getDepartments,
    enabled: isAdmin,
    initialData: [],
  });
}

export function usePendingLeaves() {
  const isAdmin = useIsAdmin();
  return useInfiniteQuery({
    queryKey: [...root, "leaves", "pending"],
    queryFn: ({ pageParam = 1 }) => getPendingLeaves(pageParam, 20),
    initialPageParam: 1,
    enabled: isAdmin,
    placeholderData: keepPreviousData,
    getNextPageParam: (last) => {
      const meta = last.meta ?? last.pagination;
      if (!meta) return undefined;
      const next = meta.page + 1;
      return next <= meta.totalPages ? next : undefined;
    },
  });
}

export function usePendingAbsences() {
  const isAdmin = useIsAdmin();
  return useInfiniteQuery({
    queryKey: [...root, "absences", "pending"],
    queryFn: ({ pageParam = 1 }) => getPendingAbsences(pageParam, 20),
    initialPageParam: 1,
    enabled: isAdmin,
    placeholderData: keepPreviousData,
    getNextPageParam: (last) => {
      const meta = last.meta ?? last.pagination;
      if (!meta) return undefined;
      const next = meta.page + 1;
      return next <= meta.totalPages ? next : undefined;
    },
  });
}

export function useAdminPlanning(year: number, month: number) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "planning", year, month],
    queryFn: () => getPlanning(year, month),
    enabled: isAdmin,
  });
}

export function useAdminRoles() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "roles"],
    queryFn: getRoles,
    enabled: isAdmin,
  });
}

export function useAdminSettings() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "settings"],
    queryFn: getSettings,
    enabled: isAdmin,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: keyof AdminSettings; value: string | boolean }) =>
      updateSetting(key, value),
    onSuccess: (data) => {
      queryClient.setQueryData([...root, "settings"], data);
    },
  });
}

export function useAdminSites() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "sites"],
    queryFn: getSites,
    enabled: isAdmin,
  });
}

export function useAdminDevices() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "devices"],
    queryFn: getDevices,
    enabled: isAdmin,
  });
}

function invalidateDevices(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [...root, "devices"] });
  queryClient.invalidateQueries({ queryKey: [...root, "pending-counts"] });
}

export function useApproveDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveDevice(id),
    onSuccess: () => invalidateDevices(queryClient),
  });
}

export function useRevokeDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeDevice(id),
    onSuccess: () => invalidateDevices(queryClient),
  });
}

export function usePhotoRequests() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "photo-requests"],
    queryFn: getPhotoRequests,
    enabled: isAdmin,
  });
}

function invalidatePhotos(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [...root, "photo-requests"] });
  queryClient.invalidateQueries({ queryKey: [...root, "pending-counts"] });
}

export function useApprovePhotoRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => approvePhotoRequest(userId),
    onSuccess: () => invalidatePhotos(queryClient),
  });
}

export function useRejectPhotoRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => rejectPhotoRequest(userId),
    onSuccess: () => invalidatePhotos(queryClient),
  });
}

// ── Équipes ──────────────────────────────────────────────────────────────────
export function useTeams() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "teams"],
    queryFn: getTeams,
    enabled: isAdmin,
  });
}

function invalidateTeams(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [...root, "teams"] });
  queryClient.invalidateQueries({ queryKey: [...root, "employees"] });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamInput) => createTeam(input),
    onSuccess: () => invalidateTeams(queryClient),
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTeamInput }) => updateTeam(id, input),
    onSuccess: () => invalidateTeams(queryClient),
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => invalidateTeams(queryClient),
  });
}

// ── Historique admin (pointages & congés) ────────────────────────────────────
export function useAdminAttendances(limit = 100) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "admin-attendances", limit],
    queryFn: () => getAdminAttendances(limit),
    enabled: isAdmin,
  });
}

export function useAdminLeaves(status?: string) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "admin-leaves", status ?? "all"],
    queryFn: () => getAdminLeaves(status),
    enabled: isAdmin,
  });
}

export function useAdminDepartments(days = 30) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "departments", days],
    queryFn: () => getAnalyticsDepartments(days),
    enabled: isAdmin,
  });
}

export function useAdminReports(days = 30) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "reports", days],
    queryFn: () => getReports(days),
    enabled: isAdmin,
  });
}

export function useAdminActions() {
  const queryClient = useQueryClient();
  const adminId = useAuthStore((s) => s.user?.id);
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: root }),
      queryClient.invalidateQueries({ queryKey: ["leaves"] }),
      queryClient.invalidateQueries({ queryKey: ["absences"] }),
    ]);

  const approveLeaveMutation = useMutation({
    mutationFn: (id: string) => {
      if (!adminId) throw new Error("Session admin introuvable");
      return approveLeave(id, adminId);
    },
    onSuccess: invalidate,
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => {
      if (!adminId) throw new Error("Session admin introuvable");
      return rejectLeave(id, adminId, comment);
    },
    onSuccess: invalidate,
  });

  const approveAbsenceMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      updateAbsenceStatus(id, "JUSTIFIED", comment),
    onSuccess: invalidate,
  });

  const rejectAbsenceMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      updateAbsenceStatus(id, "UNJUSTIFIED", comment),
    onSuccess: invalidate,
  });

  return {
    approveLeaveMutation,
    rejectLeaveMutation,
    approveAbsenceMutation,
    rejectAbsenceMutation,
  };
}
