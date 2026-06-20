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

export type RotateKeysDocumentPayload = {
  id: string
  encryptedData: string
  /** Present when rotating OpenPGP keys for `self_pgp` (per-item key) documents. */
  wrappedItemKey?: string
}

export type RotateKeysPayload = UserKeys & {
  documents: Array<RotateKeysDocumentPayload>
  /** SHA-256 (hex) of normalized new recovery phrase; updates server recovery proof after rotation. */
  recoveryPhraseSha256?: string
}

export type RotateEncryptionKeysMutationVars = {
  accountPassword: string
}
