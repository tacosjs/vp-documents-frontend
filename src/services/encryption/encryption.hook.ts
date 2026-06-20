import { useCallback } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import {
  encryptTextWithTenantSymmetricKey,
  encryptWithPublicKey,
} from '@/lib/crypto'
import { useMeQuery } from '@/services/auth'
import { useCollectionSymmetricKeyQuery } from '@/services/collections'
import type { Document } from '@/services/documents'
import { decryptionKeys } from '@/services/queryKeys'
import { useTenantSymmetricKeyQuery } from '@/services/tenantKey'
import { useGetUserKeysQuery } from '@/services/userKeys'

import {
  decryptDocumentPayload,
  documentNeedsOrganizationKey,
} from './encryption.query'

export type UserKeysState = {
  encryptedPrivateKey: string
  publicKey: string
} | null

export const useEncryption = () => {
  const { data: me } = useMeQuery()
  const { data: keys, isPending: keysPending } = useGetUserKeysQuery()

  const userKeys: UserKeysState | undefined =
    me == null ? null : keysPending ? undefined : (keys ?? null)

  const encryptData = useCallback(
    async (data: string): Promise<string> => {
      if (!keys) throw new Error('No public key available')
      return encryptWithPublicKey(data, keys.publicKey)
    },
    [keys],
  )

  /** Encrypt a document body: owner-only PGP, or AES-GCM with the workspace key. */
  const encryptDocumentPlaintext = useCallback(
    async (
      plaintext: string,
      mode: 'ownerPgp' | 'tenantAes',
      tenantKey?: Uint8Array,
    ): Promise<string> => {
      if (mode === 'tenantAes') {
        if (!tenantKey) throw new Error('Tenant key required')
        return encryptTextWithTenantSymmetricKey(plaintext, tenantKey)
      }
      if (!keys) throw new Error('No public key available')
      return encryptWithPublicKey(plaintext, keys.publicKey)
    },
    [keys],
  )

  return {
    encryptData,
    encryptDocumentPlaintext,
    userKeys,
  }
}

export const useDecryptedDocumentPreview = (document: Document | null) => {
  const { encryptionUnlockId: unlockId, passphrase } = useEncryptionSession()
  const { userKeys } = useEncryption()
  const tenantKeyQuery = useTenantSymmetricKeyQuery()
  const scheme = document?.wrapScheme ?? null
  const collectionKeyQuery = useCollectionSymmetricKeyQuery(
    scheme === 'collection_aes' ? document?.collectionId : null,
  )

  const id = document?.id ?? ''
  const encryptedData = document?.encryptedData ?? ''

  const needsOrgKey = scheme ? documentNeedsOrganizationKey(scheme) : false
  const tenantReady = !needsOrgKey || tenantKeyQuery.isSuccess
  const collectionReady =
    scheme !== 'collection_aes' || collectionKeyQuery.isSuccess

  const query = useQuery({
    queryFn: () => {
      if (!document || !userKeys || !passphrase) {
        throw new Error('Missing decryption context')
      }
      return decryptDocumentPayload({
        collectionSymmetricKey: collectionKeyQuery.data,
        document,
        encryptedData,
        encryptedPrivateKey: userKeys.encryptedPrivateKey,
        passphrase,
        tenantSymmetricKey: tenantKeyQuery.data,
      })
    },
    enabled: Boolean(
      document &&
      passphrase &&
      unlockId &&
      userKeys &&
      encryptedData &&
      tenantReady &&
      collectionReady,
    ),
    queryKey: [
      ...decryptionKeys.document(id, unlockId ?? ''),
      scheme,
      document?.collectionId ?? '',
      tenantKeyQuery.dataUpdatedAt,
      collectionKeyQuery.dataUpdatedAt,
    ],
  })

  return {
    passphrase,
    userKeys,
    ...query,
  }
}
