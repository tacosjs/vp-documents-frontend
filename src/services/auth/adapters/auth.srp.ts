import { apiJson } from '@/lib/http/apiClient'

import type { RegisterKeyMaterial } from '../auth.type'

import {
  deriveLoginSessionRust,
  deriveSrpPrivateKey,
  deriveSrpVerifier,
  generateLoginEphemeral,
  generateSrpRegistrationSalt,
  verifyLoginServerProofRust,
} from './srpRustLogin'

type LoginStartResponse = {
  sessionId: string
  b: string
  salt: string
}

type LoginConfirmResponse = {
  server_proof: string
}

/** Trim + lowercase so SRP identity matches the API and PostgreSQL lookups. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function completeSrpLogin(
  email: string,
  password: string,
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('SRP authentication is only available in the browser')
  }

  const identity = normalizeEmail(email)

  const start = await apiJson<LoginStartResponse>('/auth/login/start', {
    body: JSON.stringify({ email: identity }),
    method: 'POST',
  })

  const privateKey = await deriveSrpPrivateKey(start.salt, identity, password)
  const ephemeral = generateLoginEphemeral()
  const session = await deriveLoginSessionRust(
    ephemeral.secret,
    start.b,
    privateKey,
  )

  const confirm = await apiJson<LoginConfirmResponse>('/auth/login/confirm', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: start.sessionId,
      aPub: session.aPubHex,
      clientProof: session.clientProofHex,
    }),
  })

  await verifyLoginServerProofRust(
    session.aPubHex,
    session.clientProofHex,
    session.premasterBytes,
    confirm.server_proof,
  )
}

export async function registerWithSrp(
  email: string,
  password: string,
  keys: RegisterKeyMaterial,
  recoveryPhraseSha256: string,
  options?: { inviteToken?: string },
): Promise<void> {
  const identity = normalizeEmail(email)
  const salt = generateSrpRegistrationSalt()
  const privateKey = await deriveSrpPrivateKey(salt, identity, password)
  const verifier = deriveSrpVerifier(privateKey)

  const body: Record<string, unknown> = {
    email: identity,
    encryptedPassphrase: keys.encryptedPassphrase,
    encryptedPrivateKey: keys.encryptedPrivateKey,
    publicKey: keys.publicKey,
    recoveryPhraseSha256,
    salt,
    verifier,
  }
  const token = options?.inviteToken?.trim()
  if (token) {
    body.inviteToken = token
  }

  await apiJson<{ status: string }>('/auth/register', {
    body: JSON.stringify(body),
    method: 'POST',
  })
}
