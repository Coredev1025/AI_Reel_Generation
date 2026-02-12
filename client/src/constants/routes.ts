/**
 * Application route paths.
 */

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  USER_MANAGEMENT: '/user-management',
  PROMPT_MANAGEMENT: '/prompt-management',
  ANALYTICS: '/analytics',
  ADMIN: '/admin',
  PROJECT: (id: string) => `/project/${id}`,
  PROJECT_SETTINGS: (projectId: string) => `/project/${projectId}/settings`,
  PROCESSING: (projectId: string, processingId: string) =>
    `/processing/${projectId}/${processingId}`,
  VIDEO_STREAM: (videoId: string) => `/video/${videoId}/stream`,
  SHARED_VIDEO: (token: string) => `/share/${token}`,
} as const;
