import type { components } from '@tacosjs/vp-documents-api'

export type UserKeys = {
  encryptedPassphrase: string
  encryptedPrivateKey: string
  publicKey: string
}

export type KeyHistoryEntry = {
  id: string
  publicKeySha256Hex: string
  recordedAt: number
}

export type KeyHistoryResponse = {
  entries: Array<KeyHistoryEntry>
}

export type SecurityActivityKind = 'password_changed' | 'public_key'

export type SecurityActivityEvent = {
  id: string
  kind: SecurityActivityKind
  recordedAt: number
  publicKeySha256Hex?: string
}

export type SecurityActivityResponse = {
  events: Array<SecurityActivityEvent>
}

export type RotateKeysPayload = components['schemas']['RotateKeysRequest']

export type RotateEncryptionKeysMutationVars = {
  accountPassword: string
}
