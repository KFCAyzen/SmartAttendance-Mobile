/**
 * Décision de redirection du layout racine, extraite en fonction pure (sans
 * dépendances React/Expo) pour être testable en isolation.
 *
 * `effectiveAdmin` = l'utilisateur a la capacité admin/RH **et** sa session est
 * en `viewMode === 'admin'`. Un admin basculé en mode employé passe donc
 * `effectiveAdmin = false` et est routé exactement comme un employé — c'est ce
 * qui permet la bascule de rôle sans être renvoyé vers le back-office.
 */
export type GuardStatus =
  | 'idle'
  | 'loading'
  | 'verifying_device'
  | 'device_pending'
  | 'device_error'
  | 'authenticated'
  | 'unauthenticated';

export interface GuardInput {
  navReady: boolean;
  status: GuardStatus;
  effectiveAdmin: boolean;
  segments: readonly string[];
}

export function homeRoute(effectiveAdmin: boolean): '/(admin)/(home)' | '/(tabs)' {
  return effectiveAdmin ? '/(admin)/(home)' : '/(tabs)';
}

/**
 * Renvoie la route vers laquelle rediriger, ou `null` si l'emplacement courant
 * est déjà cohérent (aucune navigation).
 */
export function resolveRedirect({
  navReady,
  status,
  effectiveAdmin,
  segments,
}: GuardInput): string | null {
  if (
    !navReady ||
    status === 'idle' ||
    status === 'loading' ||
    status === 'verifying_device'
  ) {
    return null;
  }

  const inAuthGroup = segments[0] === '(auth)';
  const inAdminGroup = segments[0] === '(admin)';
  const inTabsGroup = segments[0] === '(tabs)';
  const currentRoute = segments.join('/');
  // device-pending exige une session vivante : une déconnexion depuis cet écran
  // (qui vit dans (auth)) doit retomber sur login malgré le garde inAuthGroup.
  const onDevicePending = currentRoute === '(auth)/device-pending';

  if (status === 'unauthenticated' && (!inAuthGroup || onDevicePending)) {
    return '/(auth)/login';
  }
  if (
    (status === 'device_pending' || status === 'device_error') &&
    currentRoute !== '(auth)/device-pending'
  ) {
    return '/(auth)/device-pending';
  }
  if (status === 'authenticated') {
    // Aiguillage par rôle effectif : admins → back-office, employés → app.
    if (inAuthGroup) return homeRoute(effectiveAdmin);
    if (effectiveAdmin && inTabsGroup) return '/(admin)/(home)';
    if (!effectiveAdmin && inAdminGroup) return '/(tabs)';
  }
  return null;
}
