import { useEffect, useRef } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { useMeQuery } from '@/services/auth'
import { tenantKeys } from '@/services/queryKeys'
import { listMembers } from '@/services/tenants'
import { useGetUserKeysQuery } from '@/services/userKeys'

import {
  distributeWorkspaceKeyToMembers,
  useTenantSymmetricKeyQuery,
} from './tenantKey.hook'

export const organizationKeyMissingWrapsQueryKey = (
  tenantId: string,
  unlockId: string | null | undefined,
) => ['organizationKeyMissingWraps', tenantId, unlockId ?? ''] as const

/** Exported for unit tests (refetch interval predicate). */
export const membersMissingOrganizationKeyWrap = (
  members: Array<{
    hasOrganizationKeyWrap: boolean
    publicKey: string
    accessValidated?: boolean
  }>,
): boolean =>
  members.some(
    (m) =>
      m.publicKey.trim().length > 0 &&
      !m.hasOrganizationKeyWrap &&
      m.accessValidated !== false,
  )

/**
 * When an admin has the organization key in memory, automatically POST wrapped copies
 * for validated members who still lack a `tenant_key_wrappings` row.
 */
export const useAutoDistributeOrganizationKeyWraps = (): void => {
  const { data: me } = useMeQuery()
  const { encryptionUnlockId: unlockId, passphrase } = useEncryptionSession()
  const { data: keys } = useGetUserKeysQuery()
  const tenantKeyQuery = useTenantSymmetricKeyQuery()
  const queryClient = useQueryClient()
  const inFlight = useRef(false)

  const tenantId = me?.tenantId ?? ''
  const isAdmin = me?.tenantRole === 'admin'
  const rotationPending = me?.rotationPendingSinceMs != null

  const membersQuery = useQuery({
    queryKey: organizationKeyMissingWrapsQueryKey(tenantId, unlockId),
    queryFn: () => listMembers(tenantId, { includePublicKeys: true }),
    refetchInterval: (q) => {
      const d = q.state.data
      if (!d) return false
      return membersMissingOrganizationKeyWrap(d) ? 15_000 : false
    },
    enabled: Boolean(
      isAdmin &&
      tenantId &&
      unlockId &&
      passphrase &&
      keys &&
      tenantKeyQuery.isSuccess &&
      !rotationPending,
    ),
  })

  useEffect(() => {
    if (
      !membersQuery.data ||
      !tenantKeyQuery.isSuccess ||
      rotationPending ||
      inFlight.current
    ) {
      return
    }

    const missing = membersQuery.data.filter(
      (m) =>
        m.publicKey.trim().length > 0 &&
        !m.hasOrganizationKeyWrap &&
        m.accessValidated,
    )
    if (missing.length === 0) return

    inFlight.current = true
    void (async () => {
      try {
        await distributeWorkspaceKeyToMembers(
          tenantId,
          tenantKeyQuery.data,
          missing,
        )
        await queryClient.invalidateQueries({
          queryKey: organizationKeyMissingWrapsQueryKey(tenantId, unlockId),
        })
        await queryClient.invalidateQueries({
          queryKey: tenantKeys.members(tenantId),
        })
      } catch (err) {
        console.error('Organization key auto-distribution failed', err)
      } finally {
        inFlight.current = false
      }
    })()
  }, [
    membersQuery.data,
    membersQuery.dataUpdatedAt,
    tenantKeyQuery.isSuccess,
    tenantKeyQuery.data,
    tenantId,
    unlockId,
    rotationPending,
    queryClient,
  ])
}
