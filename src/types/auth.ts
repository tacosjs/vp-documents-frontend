/**
 * Authentication and timing constants
 * Centralized configuration for timeouts, intervals, and time windows
 */
export const AUTH_TIMEOUTS = {
  /** Polling interval for waiting operations */
  POLL_INTERVAL: 200,

  /** Polling interval for waiting for user keys */
  USER_KEYS_POLL_INTERVAL: 100,

  /** Timeout for waiting for user keys after sign-in */
  USER_KEYS_TIMEOUT: 5000,
}

/**
 * Two-factor authentication strategy priority order
 * Higher priority strategies will be preferred as defaults
 */
export const TWO_FACTOR_PRIORITY = [
  'phone_code',
  'email_code',
  'totp',
  'backup_code',
]

export type TwoFactorStrategy = (typeof TWO_FACTOR_PRIORITY)[number]

export const EMAIL_CODE_STRATEGY = 'email_code'
