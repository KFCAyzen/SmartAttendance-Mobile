// ============================================================================
// FICHIER GÉNÉRÉ — NE PAS MODIFIER À LA MAIN.
// Source de vérité : SmartAttendance-Backend (prisma/schema.prisma +
// shared/api-contract.ts). Régénérer avec `npm run sync:types` côté backend.
// ============================================================================

/** Enum Prisma `Role`. */
export type Role = 'EMPLOYEE' | 'HR' | 'ADMIN';

/** Enum Prisma `DeviceStatus`. */
export type DeviceStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

/** Enum Prisma `AttendanceType`. */
export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';

/** Enum Prisma `ShiftType`. */
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'CUSTOM';

/** Enum Prisma `ScheduleType`. */
export type ScheduleType = 'FIXED' | 'FLEXIBLE' | 'SHIFT';

/** Enum Prisma `NotificationType`. */
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_INTERRUPTED' | 'LEAVE_RESTORED' | 'ATTENDANCE_REMINDER';

/** Enum Prisma `LeaveType`. */
export type LeaveType = 'PAID_LEAVE' | 'RTT' | 'SICK_LEAVE' | 'UNPAID_LEAVE' | 'OTHER';

/** Enum Prisma `LeaveStatus`. */
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'INTERRUPTED';

/** Enum Prisma `AbsenceType`. */
export type AbsenceType = 'LATE' | 'UNJUSTIFIED' | 'JUSTIFIED' | 'HALF_DAY' | 'NO_SHOW' | 'MISSING_CHECKOUT' | 'EARLY_LEAVE';

/** Enum Prisma `AbsenceStatus`. */
export type AbsenceStatus = 'PENDING' | 'JUSTIFIED' | 'UNJUSTIFIED' | 'EXCUSED';

/**
 * Contrat d'API partagé — SOURCE DE VÉRITÉ (avec les enums de prisma/schema.prisma).
 *
 * Ce fichier est concaténé aux enums générés depuis le schéma Prisma par
 * `npm run sync:types`, puis copié dans les repos clients :
 *   - SmartAttendance-Mobile  → src/api/shared-types.generated.ts
 *   - SmartAttendance-frontend → lib/shared-types.generated.ts
 *
 * Règles :
 *   - aucun import ici (le fichier doit rester autonome après concaténation) ;
 *   - il peut référencer les enums Prisma (Role, LeaveType, …) : ils sont
 *     injectés au-dessus dans le fichier généré ;
 *   - toute évolution du contrat se fait ICI, jamais dans les copies générées.
 */

// ————————————————————————————————————————————————————————————————
// Codes d'erreur métier renvoyés par l'API (champ `code` du payload).
// ————————————————————————————————————————————————————————————————
export const API_ERROR_CODES = [
  'REFERENCE_PHOTO_REQUIRED',
  'REFERENCE_PHOTO_INVALID',
  'ATTENDANCE_PHOTO_REQUIRED',
  'DEVICE_REQUIRED',
  'DEVICE_NOT_REGISTERED',
  'DEVICE_NOT_APPROVED',
  'DEVICE_NOT_AUTHORIZED',
  'LOCATION_OR_WIFI_REQUIRED',
  'ATTENDANCE_CONTEXT_NOT_AUTHORIZED',
  'ATTENDANCE_ALREADY_CHECKED_IN',
  'ATTENDANCE_ALREADY_CHECKED_OUT',
  'ATTENDANCE_CHECKIN_NOT_FOUND',
  'FACE_MISMATCH',
  'FACE_NOT_RECOGNIZED',
  'NO_USERS_WITH_PHOTOS',
  'FACE_VERIFICATION_UNAVAILABLE',
  'FACE_IDENTIFICATION_UNAVAILABLE',
  'SITE_DELETE_BLOCKED',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorPayload {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  code?: ApiErrorCode | string;
  action?: string;
}

// ————————————————————————————————————————————————————————————————
// Objets du contrat (formes sérialisées JSON : les dates sont des string ISO).
// ————————————————————————————————————————————————————————————————

/** Alias historique côté clients. */
export type UserRole = Role;

/** Type d'une structure (tenant) : entreprise ou école. */
export type StructureType = 'ENTERPRISE' | 'SCHOOL';

/** Structure d'appartenance jointe par le backend (login, /auth/me). */
export interface ApiUserStructure {
  id: string;
  name: string;
  type: StructureType;
}

export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  photoUrl?: string | null;
  department?: string | null;
  teamId?: string | null;
  siteId?: string | null;
  site?: { name: string } | null;
  structureId?: string | null;
  structure?: ApiUserStructure | null;
  isActive: boolean;
  isPending: boolean;
}

export interface LoginResponse {
  user: ApiUser;
  accessToken: string;
}

export interface FaceCheckInPayload {
  photo: string;
  deviceId: string;
  latitude?: number;
  longitude?: number;
  wifiSSID?: string;
  wifiBSSID?: string;
}

export interface FaceCheckInResponse {
  success: boolean;
  message: string;
  user?: { id: string; name: string; department?: string | null };
  attendance?: {
    id: string;
    type: AttendanceType;
    timestamp: string;
    location?: string | null;
    faceConfidence?: number;
  };
}

export interface ApiNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
  readAt?: string | null;
}
