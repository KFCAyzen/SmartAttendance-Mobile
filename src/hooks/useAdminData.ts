import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  approveLeave,
  getAdminOverview,
  getAdminPendingCounts,
  getPendingAbsences,
  getPendingLeaves,
  rejectLeave,
  updateAbsenceStatus,
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

export function useAdminOverview() {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [...root, "overview"],
    queryFn: getAdminOverview,
    enabled: isAdmin,
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
