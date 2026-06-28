import { faker } from '@faker-js/faker'

import { hashRecoveryPhraseSha256Hex } from '@/lib/crypto'
import { ApiHttpError } from '@/lib/http/apiClient'

import type { PatchMeBody } from './adapters/auth.query'
import { normalizeEmail } from './adapters/auth.srp'
import type { Me } from './auth.type'

faker.seed(54_321)

let mockSession: Me | null = null
let lastMockPassword: string | null = null
let mockRecoveryEmail: string | null = null
let mockRecoverySha256Hex: string | null = null

export const getMockAuthSession = (): Me | null => mockSession

export const getLastMockLoginPassword = (): string | null => lastMockPassword

export const clearMockAuthState = (): void => {
  mockSession = null
  lastMockPassword = null
  mockRecoveryEmail = null
  mockRecoverySha256Hex = null
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

export const getMockMe = async (): Promise<Me | null> => {
  await delay(20)
  return mockSession
}

export const mockLogoutMutation = async (): Promise<void> => {
  await delay(20)
  clearMockAuthState()
}

export const mockDeleteAccount = async (): Promise<void> => {
  await delay(20)
  clearMockAuthState()
}

export const mockCompleteSrpLogin = async (
  email: string,
  password: string,
): Promise<void> => {
  await delay(50)
  lastMockPassword = password
  mockSession = {
    tenantId: null,
    userId: faker.string.uuid(),
    displayName: null,
    email: normalizeEmail(email),
    organizationAccessPendingValidation: null,
    organizationKeyVersion: null,
    preferredLocale: 'en',
    rotationPendingSinceMs: null,
    tenantName: null,
    tenantRole: null,
  }
}

export const mockPatchMe = async (body: PatchMeBody): Promise<void> => {
  await delay(30)
  if (!mockSession) {
    throw new Error('Not authenticated')
  }
  let next = mockSession
  if (body.displayName != null) {
    const trimmed = body.displayName.trim()
    next = {
      ...next,
      displayName: trimmed.length === 0 ? null : trimmed,
    }
  }
  if (body.email != null) {
    next = { ...next, email: normalizeEmail(body.email) }
  }
  if (body.preferredLocale != null) {
    next = {
      ...next,
      preferredLocale: body.preferredLocale.trim(),
    }
  }
  mockSession = next
}

/** Mock password change: only updates the password remembered for mock key ops. */
export const mockChangeAccountPassword = async (
  newPassword: string,
): Promise<void> => {
  await delay(40)
  lastMockPassword = newPassword
}

export const mockRegisterWithSrp = async (): Promise<void> => {
  await delay(50)
}

/** Stores the recovery hash for mock password reset (same as sent on real register). */
export const recordMockAccountRecoveryMaterial = async (
  email: string,
  recoveryPhraseSha256Hex: string,
): Promise<void> => {
  await delay(0)
  mockRecoveryEmail = normalizeEmail(email)
  mockRecoverySha256Hex = recoveryPhraseSha256Hex
}

export const mockVerifyAccountRecovery = async (
  email: string,
  recoveryPhrase: string,
): Promise<{ recoveryToken: string }> => {
  await delay(50)
  const h = await hashRecoveryPhraseSha256Hex(recoveryPhrase)
  if (
    !mockRecoveryEmail ||
    !mockRecoverySha256Hex ||
    normalizeEmail(email) !== mockRecoveryEmail ||
    h !== mockRecoverySha256Hex
  ) {
    throw new ApiHttpError(401, 'Invalid credentials')
  }
  return { recoveryToken: `mock-recovery-${mockRecoveryEmail}` }
}

export const mockCompleteAccountPasswordRecovery = async (
  newPassword: string,
): Promise<void> => {
  await delay(50)
  lastMockPassword = newPassword
}

/** Join a workspace as if the invite accept API succeeded (mock-only). */
export const mockAcceptInvitation = async (): Promise<void> => {
  await delay(40)
  if (!mockSession) {
    throw new Error('Not authenticated')
  }
  if (mockSession.tenantId) {
    return
  }
  mockSession = {
    ...mockSession,
    tenantId: faker.string.uuid(),
    organizationAccessPendingValidation: true,
    organizationKeyVersion: null,
    rotationPendingSinceMs: null,
    tenantName: 'Invited workspace',
    tenantRole: 'editor',
  }
}
