import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  approveLeave,
  createEmployee,
  createLeaveRequest,
  createSite,
  getAdminOverview,
  getAdminPendingCounts,
  getAnalyticsDepartments,
  getAnalyticsPresence,
  getDevices,
  getEmployees,
  getLivePresence,
  getPendingAbsences,
  getPendingLeaves,
  getPlanning,
  getReports,
  getRoles,
  getSettings,
  getSites,
  rejectLeave,
  updateAbsenceStatus,
  updateSetting,
  type AdminSettings,
  type CreateEmployeeInput,
  type CreateLeaveInput,
  type CreateSiteInput,
} from "../api/admin";
import { useAuthStore } from "../stores/auth.store";

const root = ["admin"] as const;

export function useIsAdmin() {
  return useAuthStore((s) => s.user?.role === "ADMIN" || s.user?.role === "HR");
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

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSiteInput) => createSite(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...root, "sites"] }),
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

export function useEmployees(search: string, department?: string) {
  const isAdmin = useIsAdmin();
  return useInfiniteQuery({
    queryKey: [...root, "employees", search, department ?? "all"],
    queryFn: ({ pageParam = 1 }) => getEmployees(pageParam, 20, search, department),
    initialPageParam: 1,
    enabled: isAdmin,
    getNextPageParam: (last) => {
      const meta = last.meta ?? last.pagination;
      if (!meta) return undefined;
      const next = meta.page + 1;
      return next <= meta.totalPages ? next : undefined;
    },
  });
}

export function useEmployeeDepartments(search: string) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "employee-departments", search],
    queryFn: async () => {
      const response = await getEmployees(1, 1000, search);
      const employees = response.data ?? response.items ?? [];
      return Array.from(
        new Set(
          employees
            .map((employee) => employee.department)
            .filter((department): department is string => !!department),
        ),
      ).sort((a, b) => a.localeCompare(b));
    },
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
