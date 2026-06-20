import type { DocumentWrapScheme } from '@/lib/crypto'
import {
  decryptDocumentBodyWithItemKey,
  unwrapItemKeyFromPgp,
  unwrapRawKeyWithAes256Gcm,
} from '@/lib/crypto'
import type { Document } from '@/services/documents/documents.type'

export type DecryptDocumentPayloadParams = {
  document: Document
  encryptedData: string
  encryptedPrivateKey: string
  passphrase: string
  collectionSymmetricKey?: Uint8Array | null
  tenantSymmetricKey?: Uint8Array | null
}

export const decryptDocumentPayload = async (
  params: DecryptDocumentPayloadParams,
): Promise<string> => {
  const {
    collectionSymmetricKey,
    document,
    encryptedData,
    encryptedPrivateKey,
    passphrase,
    tenantSymmetricKey,
  } = params
  if (!passphrase) throw new Error('No passphrase available')

  const scheme: DocumentWrapScheme = document.wrapScheme

  switch (scheme) {
    case 'self_pgp': {
      if (!document.wrappedItemKey) {
        throw new Error('Missing wrappedItemKey')
      }
      const ik = await unwrapItemKeyFromPgp(
        document.wrappedItemKey,
        encryptedPrivateKey,
        passphrase,
      )
      return decryptDocumentBodyWithItemKey(encryptedData, ik)
    }
    case 'organization_aes': {
      if (!document.wrappedItemKey || !tenantSymmetricKey) {
        throw new Error('Missing organization key or wrapped item key')
      }
      const ik = await unwrapRawKeyWithAes256Gcm(
        document.wrappedItemKey,
        tenantSymmetricKey,
      )
      return decryptDocumentBodyWithItemKey(encryptedData, ik)
    }
    case 'collection_aes': {
      if (!document.wrappedItemKey || !collectionSymmetricKey) {
        throw new Error('Missing collection key or wrapped item key')
      }
      const ik = await unwrapRawKeyWithAes256Gcm(
        document.wrappedItemKey,
        collectionSymmetricKey,
      )
      return decryptDocumentBodyWithItemKey(encryptedData, ik)
    }
    default:
      throw new Error(`Unsupported wrapScheme: ${String(scheme)}`)
  }
}

export type DecryptHistoryPayloadParams = {
  document: Document
  encryptedPayload: string
  encryptedPrivateKey: string
  passphrase: string
  collectionSymmetricKey?: Uint8Array | null
  tenantSymmetricKey?: Uint8Array | null
}

export const decryptDocumentHistoryPayload = async (
  params: DecryptHistoryPayloadParams,
): Promise<string> => {
  return decryptDocumentPayload({
    collectionSymmetricKey: params.collectionSymmetricKey,
    document: params.document,
    encryptedData: params.encryptedPayload,
    encryptedPrivateKey: params.encryptedPrivateKey,
    passphrase: params.passphrase,
    tenantSymmetricKey: params.tenantSymmetricKey,
  })
}

/** True when the client must load the organization symmetric key to decrypt. */
export const documentNeedsOrganizationKey = (
  scheme: DocumentWrapScheme,
): boolean => scheme === 'organization_aes' || scheme === 'collection_aes'

/** True when the document has versioned ciphertext history. */
export const documentHasVersionHistory = (
  scheme: DocumentWrapScheme,
): boolean => scheme === 'organization_aes' || scheme === 'collection_aes'
