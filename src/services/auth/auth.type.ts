import type { Dispatch, FormEvent, SetStateAction } from 'react'

export type Me = {
  /** Workspace id from membership; null if not in a workspace yet. */
  tenantId: string | null
  userId: string
  displayName: string | null
  email: string
  /**
   * True after joining via invite until an organization admin grants access.
   * `null` when not in an organization or not returned by the API.
   */
  organizationAccessPendingValidation: boolean | null
  /** Workspace organization-key generation; use when uploading wrappings / creating org-scoped ciphertext. */
  organizationKeyVersion: number | null
  /** BCP 47-style tag; must match app `locales` (e.g. en, fr). */
  preferredLocale: string
  /**
   * When set, an admin must complete organization-key rotation (e.g. after a member was removed).
   * Milliseconds since Unix epoch.
   */
  rotationPendingSinceMs: number | null
  /** Workspace display name from `/api/me` when in a workspace. */
  tenantName: string | null
  /** Role in that workspace. */
  tenantRole: 'admin' | 'editor' | null
}

export type RegisterKeyMaterial = {
  encryptedPassphrase: string
  encryptedPrivateKey: string
  publicKey: string
}

export type SignInMfaFormProps = {
  code: string
  error: string | null
  isLoading: boolean
  setCode: Dispatch<SetStateAction<string>>
  handleMfaVerify: (e: FormEvent<HTMLFormElement>) => void
}

export type SignUpVerificationFormProps = {
  email: string
  error: string | null
  isLoading: boolean
  setVerificationCode: Dispatch<SetStateAction<string>>
  verificationCode: string
  handleVerification: (e: FormEvent<HTMLFormElement>) => void
}
