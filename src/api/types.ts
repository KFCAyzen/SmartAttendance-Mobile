export type UserRole = 'EMPLOYEE' | 'HR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  photoUrl?: string | null;
  department?: string | null;
  teamId?: string | null;
  siteId?: string | null;
  isActive: boolean;
  isPending: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface FaceCheckInPayload {
  photo: string;
  deviceId: string;
  latitude?: number;
  longitude?: number;
  wifiSSID?: string;
}

export interface FaceCheckInResponse {
  success: boolean;
  message: string;
  user?: { id: string; name: string; department?: string | null };
  attendance?: {
    id: string;
    type: 'CHECK_IN' | 'CHECK_OUT';
    timestamp: string;
    location?: string | null;
    faceConfidence?: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
