import type { components } from '@tacosjs/vp-documents-api'

import { apiJson } from '@/lib/http/apiClient'
import { isInvalidAccountPasswordError } from '@/services/userKeys/keyRotation'

export type ChangeAccountPasswordVars = {
  encryptedPassphrase: string
  newSalt: string
  newVerifier: string
  passwordChangeToken: string
}

/** POST /me/password/change — triggers out-of-band delivery of a password change token. */
export async function initiatePasswordChange(): Promise<void> {
  await apiJson<unknown>('/me/password/change', { method: 'POST' })
}

/** POST /me/password/apply — apply new SRP credentials using the change token. */
export async function applyAccountPasswordChange(
  payload: components['schemas']['MePasswordApplyRequest'],
): Promise<void> {
  await apiJson<unknown>('/me/password/apply', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export const isChangePasswordWrongPasswordError = (e: unknown): boolean =>
  isInvalidAccountPasswordError(e)
