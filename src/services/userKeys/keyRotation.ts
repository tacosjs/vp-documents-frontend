import {
  createPassphrase,
  decryptPassphrase,
  encryptPassphrase,
  generateKeyPair,
  hashRecoveryPhraseSha256Hex,
  unwrapItemKeyFromPgp,
  unwrapTenantSymmetricKeyFromPgp,
  wrapItemKeyWithPublicKey,
  wrapTenantSymmetricKeyForPublicKey,
} from '@/lib/crypto'
import { listDocuments } from '@/services/documents/documents.query'
import {
  fetchTenantKeyWrapping,
  postTenantKeyWrapping,
} from '@/services/tenantKey/tenantKey.query'
import { rotateKeys } from '@/services/userKeys/userKeys.query'
import type {
  RotateKeysPayload,
  UserKeys,
} from '@/services/userKeys/userKeys.type'

export type RotateEncryptionKeysParams = {
  /** When set, tenant-key documents are re-wrapped with the same TSK; wrapping is re-uploaded for the new public key. */
  tenantId: string | null
  userId: string | null
  accountEmail: string
  accountPassword: string
  currentKeys: UserKeys
  currentPassphrase: string
}

/** Thrown when the account password cannot decrypt the stored data-passphrase blob. */
export class InvalidAccountPasswordError extends Error {
  constructor() {
    super('Incorrect account password')
    this.name = 'InvalidAccountPasswordError'
  }
}

export const isInvalidAccountPasswordError = (
  e: unknown,
): e is InvalidAccountPasswordError => e instanceof InvalidAccountPasswordError

/**
 * Generates new data-passphrase + OpenPGP keypair, re-encrypts all self_pgp documents,
 * then commits atomically via API. organization_aes / collection_aes documents are skipped
 * (their item keys are wrapped with the org/collection key, which is unchanged).
 * The user's TSK wrapping is updated for the new public key if a tenant key exists.
 */
export const rotateEncryptionKeys = async ({
  tenantId,
  userId,
  accountEmail,
  accountPassword,
  currentKeys,
  currentPassphrase,
}: RotateEncryptionKeysParams): Promise<{ newPassphrase: string }> => {
  let decryptedWithPassword: string
  try {
    decryptedWithPassword = await decryptPassphrase(
      currentKeys.encryptedPassphrase,
      accountPassword,
    )
  } catch {
    throw new InvalidAccountPasswordError()
  }
  if (decryptedWithPassword !== currentPassphrase) {
    throw new InvalidAccountPasswordError()
  }

  const docs = await listDocuments()
  const newPassphrase = createPassphrase()
  const encryptedPassphrase = await encryptPassphrase(
    newPassphrase,
    accountPassword,
  )
  const { privateKey, publicKey } = await generateKeyPair(
    accountEmail.trim(),
    newPassphrase,
  )

  let tsk: Uint8Array | null = null
  let tenantWrapOkVersion: number | undefined
  if (tenantId) {
    try {
      const wrapDto = await fetchTenantKeyWrapping(tenantId)
      tenantWrapOkVersion = wrapDto.okKeyVersion
      tsk = await unwrapTenantSymmetricKeyFromPgp(
        wrapDto.wrappedTenantKey,
        currentKeys.encryptedPrivateKey,
        currentPassphrase,
      )
    } catch {
      tsk = null
    }
  }

  const documents = []
  for (const doc of docs) {
    const scheme = doc.wrapScheme
    if (scheme === 'organization_aes' || scheme === 'collection_aes') {
      continue
    }
    if (!doc.wrappedItemKey) {
      throw new Error('Missing wrappedItemKey for self_pgp document')
    }
    const ik = await unwrapItemKeyFromPgp(
      doc.wrappedItemKey,
      currentKeys.encryptedPrivateKey,
      currentPassphrase,
    )
    const wrappedItemKey = await wrapItemKeyWithPublicKey(ik, publicKey)
    documents.push({
      id: doc.id,
      encryptedData: doc.encryptedData,
      wrappedItemKey,
    })
  }

  const recoveryPhraseSha256 = await hashRecoveryPhraseSha256Hex(newPassphrase)

  const payload: RotateKeysPayload = {
    documents,
    encryptedPassphrase,
    encryptedPrivateKey: privateKey,
    publicKey,
    recoveryPhraseSha256,
  }
  await rotateKeys(payload)

  if (tenantId && userId && tsk) {
    const wrapped = await wrapTenantSymmetricKeyForPublicKey(tsk, publicKey)
    await postTenantKeyWrapping(tenantId, {
      userId,
      okKeyVersion: tenantWrapOkVersion ?? null,
      wrappedTenantKey: wrapped,
    })
  }

  return { newPassphrase }
}
