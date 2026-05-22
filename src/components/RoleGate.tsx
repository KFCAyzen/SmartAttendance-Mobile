import type { ReactNode } from 'react';

import type { UserRole } from '../api/types';
import { useAuthStore } from '../stores/auth.store';

export function RoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const role = useAuthStore((s) => s.user?.role);
  return role && roles.includes(role) ? children : fallback;
}
