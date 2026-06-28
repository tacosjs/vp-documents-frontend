import { useQuery } from '@tanstack/react-query'

import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { unwrapRawKeyWithAes256Gcm } from '@/lib/crypto'
import { useMeQuery } from '@/services/auth'
import { useTenantSymmetricKeyQuery } from '@/services/tenantKey'

import { getCollection } from './collections.query'

export const collectionSymmetricKeyQueryKey = (
  tenantId: string | null,
  collectionId: string | null,
  unlockId: string | null,
) => ['collectionSymmetricKey', tenantId, collectionId, unlockId] as const

/** Unwraps collection symmetric key using the organization key (in-memory only). */
export const useCollectionSymmetricKeyQuery = (
  collectionId: string | null | undefined,
) => {
  const { data: me } = useMeQuery()
  const { encryptionUnlockId: unlockId, passphrase } = useEncryptionSession()
  const tenantId = me?.tenantId ?? null
  const okQuery = useTenantSymmetricKeyQuery()
  const cid = collectionId?.trim() ? collectionId : null

  return useQuery({
    queryKey: collectionSymmetricKeyQueryKey(tenantId, cid, unlockId),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      if (!cid || !tenantId || !okQuery.data) {
        throw new Error('Missing collection key context')
      }
      const col = await getCollection(cid)
      return unwrapRawKeyWithAes256Gcm(col.wrappedCollectionKey, okQuery.data)
    },
    enabled: Boolean(
      cid &&
      tenantId &&
      passphrase &&
      unlockId &&
      okQuery.isSuccess &&
      okQuery.data,
    ),
  })
}
