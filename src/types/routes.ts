export enum RoutesPath {
  HOME = '/',
  AUTH_ROOT = '/auth',
  FORGOT_PASSWORD = '/auth/forgot-password',
  SIGN_IN = '/auth/signin',
  SIGN_UP = '/auth/signup',
  UNLOCK = '/auth/unlock',
  DOCUMENTS_CREATE = '/documents/create',
  DOCUMENTS_DETAILS = '/documents/details',
  DOCUMENTS_LIST = '/documents/list',
  /** TanStack file route: `/invite/$token` */
  INVITE_TOKEN = '/invite/$token',
  ONBOARDING_COMPANY = '/onboarding/company',
  ORG_MEMBERS = '/org/members',
  ORG_SECURITY = '/org/security',
  SETTINGS_PROFILE = '/settings/profile',
  SETTINGS_SECURITY = '/settings/security',
  SETTINGS_SECURITY_LOGS = '/settings/security/logs',
}
