import { decryptPassphrase, encryptPassphrase } from '@/lib/crypto'
import { ApiHttpError, apiJson } from '@/lib/http/apiClient'
import {
  InvalidAccountPasswordError,
  isInvalidAccountPasswordError,
} from '@/services/userKeys/keyRotation'

import { completeMePasswordSrp } from './auth.srp'
import {
  deriveSrpPrivateKey,
  deriveSrpVerifier,
  generateSrpRegistrationSalt,
} from './srpRustLogin'

export type ChangeAccountPasswordParams = {
  /** Data passphrase (recovery phrase) — must match decrypted blob with old password. */
  dataPassphrase: string
  email: string
  encryptedPassphrase: string
  newPassword: string
  oldPassword: string
}

export async function applyAccountPasswordChange(payload: {
  encrypted_passphrase: string
  new_salt: string
  new_verifier: string
  password_change_token: string
}): Promise<void> {
  await apiJson<{ status: string }>('/api/me/password', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export async function changeAccountPassword(
  params: ChangeAccountPasswordParams,
): Promise<void> {
  let decryptedWithPassword: string
  try {
    decryptedWithPassword = await decryptPassphrase(
      params.encryptedPassphrase,
      params.oldPassword,
    )
  } catch {
    throw new InvalidAccountPasswordError()
  }
  if (decryptedWithPassword !== params.dataPassphrase) {
    throw new InvalidAccountPasswordError()
  }

  let passwordChangeToken: string
  try {
    passwordChangeToken = await completeMePasswordSrp(
      params.email,
      params.oldPassword,
    )
  } catch (e) {
    if (e instanceof ApiHttpError && e.status === 401) {
      throw new InvalidAccountPasswordError()
    }
    throw e
  }

  const salt = generateSrpRegistrationSalt()
  const identity = params.email.trim().toLowerCase()
  const privateKey = await deriveSrpPrivateKey(
    salt,
    identity,
    params.newPassword,
  )
  const newVerifier = deriveSrpVerifier(privateKey)
  const encrypted_passphrase = await encryptPassphrase(
    params.dataPassphrase,
    params.newPassword,
  )

  await applyAccountPasswordChange({
    encrypted_passphrase,
    new_salt: salt,
    new_verifier: newVerifier,
    password_change_token: passwordChangeToken,
  })
}

export const isChangePasswordWrongPasswordError = (e: unknown): boolean =>
  isInvalidAccountPasswordError(e)
