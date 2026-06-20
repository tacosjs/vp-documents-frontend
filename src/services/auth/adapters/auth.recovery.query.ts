import { env } from '@/env'
import { encryptPassphrase } from '@/lib/crypto'
import { apiJson } from '@/lib/http/apiClient'

import * as authMock from '../auth.mock'

import { normalizeEmail } from './auth.srp'
import {
  deriveSrpPrivateKey,
  deriveSrpVerifier,
  generateSrpRegistrationSalt,
} from './srpRustLogin'

export type VerifyAccountRecoveryParams = {
  email: string
  recoveryPhrase: string
}

export type CompleteAccountPasswordRecoveryParams = {
  /** Normalized data passphrase (same bytes the server hashed at registration). */
  dataPassphrase: string
  email: string
  newPassword: string
  recoveryToken: string
}

export const verifyAccountRecovery = async (
  params: VerifyAccountRecoveryParams,
): Promise<{ recoveryToken: string }> => {
  if (env.VITE_MOCK_AUTH) {
    return authMock.mockVerifyAccountRecovery(
      params.email,
      params.recoveryPhrase,
    )
  }
  return apiJson<{ recoveryToken: string }>('/auth/recovery/verify', {
    method: 'POST',
    body: JSON.stringify({
      email: normalizeEmail(params.email),
      recoveryPhrase: params.recoveryPhrase,
    }),
  })
}

export const completeAccountPasswordRecovery = async (
  params: CompleteAccountPasswordRecoveryParams,
): Promise<void> => {
  if (env.VITE_MOCK_AUTH) {
    await authMock.mockCompleteAccountPasswordRecovery(params.newPassword)
    return
  }
  const salt = generateSrpRegistrationSalt()
  const identity = normalizeEmail(params.email)
  const privateKey = await deriveSrpPrivateKey(
    salt,
    identity,
    params.newPassword,
  )
  const newVerifier = deriveSrpVerifier(privateKey)
  const encryptedPassphrase = await encryptPassphrase(
    params.dataPassphrase,
    params.newPassword,
  )
  await apiJson<{ status: string }>('/auth/recovery/complete', {
    method: 'POST',
    body: JSON.stringify({
      encryptedPassphrase,
      newSalt: salt,
      newVerifier,
      recoveryToken: params.recoveryToken,
    }),
  })
}
