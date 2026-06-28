import { useQuery } from '@tanstack/react-query'

import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import {
  generateTenantSymmetricKey,
  unwrapTenantSymmetricKeyFromPgp,
  wrapTenantSymmetricKeyForPublicKey,
} from '@/lib/crypto'
import { useMeQuery } from '@/services/auth'
import { listMembers } from '@/services/tenants'
import type { TenantMember } from '@/services/tenants/tenants.type'
import { useGetUserKeysQuery } from '@/services/userKeys'

import {
  fetchTenantKeyWrapping,
  postTenantKeyWrapping,
} from './tenantKey.query'

export const tenantSymmetricKeyQueryKey = (
  tenantId: string | null,
  unlockId: string | null,
) => ['tenantSymmetricKey', tenantId, unlockId] as const

/** Loads and unwraps the workspace symmetric key (in-memory only; cleared on logout query removal). */
export const useTenantSymmetricKeyQuery = () => {
  const { data: me } = useMeQuery()
  const { encryptionUnlockId: unlockId, passphrase } = useEncryptionSession()
  const { data: keys } = useGetUserKeysQuery()
  const tenantId = me?.tenantId ?? null

  return useQuery({
    enabled: Boolean(tenantId && passphrase && unlockId && keys),
    queryKey: tenantSymmetricKeyQueryKey(tenantId, unlockId),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      if (!tenantId || !passphrase || !keys) {
        throw new Error('Missing encryption context')
      }
      const { wrappedTenantKey } = await fetchTenantKeyWrapping(tenantId)
      return unwrapTenantSymmetricKeyFromPgp(
        wrappedTenantKey,
        keys.encryptedPrivateKey,
        passphrase,
      )
    },
  })
}

/** Admin: generate a TSK and upload one wrapping per member (uses each member's public key). */
export const generateAndUploadWorkspaceKeyForMembers = async (
  tenantId: string,
  members: Array<TenantMember>,
): Promise<void> => {
  const tsk = generateTenantSymmetricKey()
  await distributeWorkspaceKeyToMembers(tenantId, tsk, members)
}

/** Admin: wrap an existing workspace key for members (e.g. new members or new public keys) without rotating the TSK. */
export const distributeWorkspaceKeyToMembers = async (
  tenantId: string,
  tenantSymmetricKey: Uint8Array,
  members: Array<TenantMember>,
): Promise<void> => {
  for (const m of members) {
    if (!m.publicKey.trim()) {
      continue
    }
    const wrapped = await wrapTenantSymmetricKeyForPublicKey(
      tenantSymmetricKey,
      m.publicKey,
    )
    await postTenantKeyWrapping(tenantId, {
      userId: m.userId,
      okKeyVersion: null,
      wrappedTenantKey: wrapped,
    })
  }
}

/** When a workspace is created, bootstrap TSK if members already have uploaded public keys (e.g. admin after unlock). */
export const tryBootstrapWorkspaceKeyForTenant = async (
  tenantId: string,
): Promise<void> => {
  const members = await listMembers(tenantId, { includePublicKeys: true })
  const withKeys = members.filter((m) => m.publicKey.trim().length > 0)
  if (withKeys.length === 0) {
    return
  }
  await generateAndUploadWorkspaceKeyForMembers(tenantId, withKeys)
}
