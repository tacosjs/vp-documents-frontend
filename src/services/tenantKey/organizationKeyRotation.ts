import {
  generateTenantSymmetricKey,
  unwrapRawKeyWithAes256Gcm,
  wrapRawKeyWithAes256Gcm,
  wrapTenantSymmetricKeyForPublicKey,
} from '@/lib/crypto'
import {
  listCollections,
  postOrganizationKeyRotate,
} from '@/services/collections/collections.query'
import { listDocuments } from '@/services/documents/documents.query'
import { listMembers } from '@/services/tenants'

export type PerformOrganizationKeyRotationParams = {
  tenantId: string
  /** Current organization symmetric key (before rotation). */
  oldTenantSymmetricKey: Uint8Array
  /** Must match `tenants.rotation_generation` / `me.organizationKeyVersion`. */
  organizationKeyVersion: number
}

/**
 * After a member is removed, the server bumps rotation generation and sets `rotationPendingSinceMs`.
 * A workspace admin must generate a new organization key, re-wrap collection keys and organization-scoped
 * item keys, and POST them atomically via `/organization-key/rotate`.
 */
export const performOrganizationKeyRotation = async ({
  tenantId,
  oldTenantSymmetricKey,
  organizationKeyVersion,
}: PerformOrganizationKeyRotationParams): Promise<void> => {
  const newTsk = generateTenantSymmetricKey()

  const members = await listMembers(tenantId, { includePublicKeys: true })
  const withKeys = members.filter((m) => m.publicKey.trim().length > 0)
  if (withKeys.length !== members.length) {
    throw new Error(
      'Every workspace member must have a public key before the organization key can be rotated.',
    )
  }

  const wrappings = await Promise.all(
    withKeys.map(async (m) => ({
      userId: m.userId,
      okKeyVersion: organizationKeyVersion,
      wrappedTenantKey: await wrapTenantSymmetricKeyForPublicKey(
        newTsk,
        m.publicKey,
      ),
    })),
  )

  const collections = await listCollections()
  const collectionRewraps = await Promise.all(
    collections.map(async (col) => {
      const ck = await unwrapRawKeyWithAes256Gcm(
        col.wrappedCollectionKey,
        oldTenantSymmetricKey,
      )
      const wrappedCollectionKey = await wrapRawKeyWithAes256Gcm(ck, newTsk)
      return {
        collectionId: col.id,
        okKeyVersion: organizationKeyVersion,
        wrappedCollectionKey,
      }
    }),
  )

  const docs = await listDocuments()
  const itemKeyRewraps: Array<{
    documentId: string
    okKeyVersion: number
    wrappedItemKey: string
  }> = []

  for (const doc of docs) {
    if (doc.wrapScheme !== 'organization_aes') continue
    if (!doc.wrappedItemKey) continue
    const ik = await unwrapRawKeyWithAes256Gcm(
      doc.wrappedItemKey,
      oldTenantSymmetricKey,
    )
    const wrappedItemKey = await wrapRawKeyWithAes256Gcm(ik, newTsk)
    itemKeyRewraps.push({
      documentId: doc.id,
      okKeyVersion: organizationKeyVersion,
      wrappedItemKey,
    })
  }

  await postOrganizationKeyRotate(tenantId, {
    collectionRewraps,
    itemKeyRewraps,
    okKeyVersion: organizationKeyVersion,
    wrappings,
  })
}
