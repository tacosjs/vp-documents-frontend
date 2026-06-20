import { useEffect, useRef } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { useMeQuery } from '@/services/auth'
import { authKeys, documentsKeys } from '@/services/queryKeys'

import { performOrganizationKeyRotation } from './organizationKeyRotation'
import { useTenantSymmetricKeyQuery } from './tenantKey.hook'

/**
 * When the server marks organization-key rotation as pending, an admin client completes it automatically
 * after the workspace symmetric key is available (user unlocked).
 */
export const usePendingOrganizationKeyRotation = (): void => {
  const { data: me } = useMeQuery()
  const { encryptionUnlockId: unlockId } = useEncryptionSession()
  const tenantKeyQuery = useTenantSymmetricKeyQuery()
  const queryClient = useQueryClient()
  const lastRunKey = useRef<string | null>(null)

  useEffect(() => {
    const tenantId = me?.tenantId ?? null
    const pendingMs = me?.rotationPendingSinceMs
    const okVersion = me?.organizationKeyVersion

    if (
      !tenantId ||
      me?.tenantRole !== 'admin' ||
      pendingMs == null ||
      okVersion == null ||
      !unlockId ||
      !tenantKeyQuery.isSuccess
    ) {
      return
    }

    const runKey = `${tenantId}:${pendingMs}:${okVersion}`
    if (lastRunKey.current === runKey) {
      return
    }
    lastRunKey.current = runKey

    void (async () => {
      try {
        await performOrganizationKeyRotation({
          tenantId,
          oldTenantSymmetricKey: tenantKeyQuery.data,
          organizationKeyVersion: okVersion,
        })
        await queryClient.invalidateQueries({ queryKey: authKeys.me })
        await queryClient.invalidateQueries({
          queryKey: ['tenantSymmetricKey'],
        })
        await queryClient.invalidateQueries({
          queryKey: ['collectionSymmetricKey'],
        })
        await queryClient.invalidateQueries({ queryKey: documentsKeys.all })
      } catch (err) {
        console.error('Organization key rotation failed', err)
        lastRunKey.current = null
      }
    })()
  }, [
    me?.tenantId,
    me?.tenantRole,
    me?.rotationPendingSinceMs,
    me?.organizationKeyVersion,
    unlockId,
    tenantKeyQuery.isSuccess,
    tenantKeyQuery.data,
    queryClient,
  ])
}
