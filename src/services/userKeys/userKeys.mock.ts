import { faker } from '@faker-js/faker'

import {
  createPassphrase,
  encryptPassphrase,
  generateKeyPair,
  sha256HexUtf8,
} from '@/lib/crypto'
import { getLastMockLoginPassword } from '@/services/auth/auth.mock'
import {
  getMockDocumentsList,
  patchMockDocument,
} from '@/services/documents/documents.mock'

import type {
  KeyHistoryEntry,
  KeyHistoryResponse,
  RotateKeysPayload,
  SecurityActivityEvent,
  SecurityActivityResponse,
  UserKeys,
} from './userKeys.type'

faker.seed(99_001)

let cache: UserKeys | null = null
let cachePassword: string | null = null
let seeded: UserKeys | null = null
let mockHistory: Array<KeyHistoryEntry> = []
let mockPasswordEvents: Array<{ id: string; recordedAt: number }> = []

const recordHistory = async (publicKey: string): Promise<void> => {
  mockHistory.push({
    id: crypto.randomUUID(),
    publicKeySha256Hex: await sha256HexUtf8(publicKey),
    recordedAt: Date.now(),
  })
}

export const seedMockUserKeys = (keys: UserKeys): void => {
  seeded = keys
  void recordHistory(keys.publicKey)
}

export const clearMockUserKeysState = (): void => {
  cache = null
  cachePassword = null
  seeded = null
  mockHistory = []
  mockPasswordEvents = []
}

export const recordMockPasswordChange = (): void => {
  mockPasswordEvents.push({
    id: crypto.randomUUID(),
    recordedAt: Date.now(),
  })
}

export const getMockUserKeys = async (): Promise<UserKeys> => {
  await new Promise((r) => setTimeout(r, 15))
  if (seeded) return seeded

  const password = getLastMockLoginPassword()
  if (!password) {
    throw new Error('Mock user keys require a mock sign-in with password first')
  }
  if (cache && cachePassword === password) return cache

  const passphrase = createPassphrase()
  const encryptedPassphrase = await encryptPassphrase(passphrase, password)
  const { privateKey, publicKey } = await generateKeyPair(
    'mock@local.test',
    passphrase,
  )
  cache = {
    encryptedPassphrase,
    encryptedPrivateKey: privateKey,
    publicKey,
  }
  cachePassword = password
  return cache
}

export const getMockKeyHistory = async (): Promise<KeyHistoryResponse> => {
  await new Promise((r) => setTimeout(r, 10))
  return { entries: [...mockHistory] }
}

export const getMockSecurityActivity =
  async (): Promise<SecurityActivityResponse> => {
    await new Promise((r) => setTimeout(r, 10))
    const fromKeys: Array<SecurityActivityEvent> = mockHistory.map((e) => ({
      id: e.id,
      kind: 'public_key',
      publicKeySha256Hex: e.publicKeySha256Hex,
      recordedAt: e.recordedAt,
    }))
    const fromPassword: Array<SecurityActivityEvent> = mockPasswordEvents.map(
      (e) => ({
        id: e.id,
        kind: 'password_changed',
        recordedAt: e.recordedAt,
      }),
    )
    const events = [...fromKeys, ...fromPassword].sort(
      (a, b) => b.recordedAt - a.recordedAt,
    )
    return { events }
  }

export const updateMockUserKeys = async (keys: UserKeys): Promise<void> => {
  await new Promise((r) => setTimeout(r, 15))
  seeded = keys
  cache = keys
  await recordHistory(keys.publicKey)
}

export const rotateMockKeys = async (
  payload: RotateKeysPayload,
): Promise<void> => {
  await new Promise((r) => setTimeout(r, 25))
  seeded = {
    encryptedPassphrase: payload.encryptedPassphrase,
    encryptedPrivateKey: payload.encryptedPrivateKey,
    publicKey: payload.publicKey,
  }
  cache = seeded
  await recordHistory(payload.publicKey)
  const docs = await getMockDocumentsList()
  const byId = new Map(payload.documents.map((d) => [d.id, d]))
  for (const d of docs) {
    const next = byId.get(d.id)
    if (!next) continue
    patchMockDocument(d.id, {
      encryptedData: next.encryptedData,
      ...(next.wrappedItemKey != null
        ? { wrappedItemKey: next.wrappedItemKey }
        : {}),
    })
  }
}
