import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { env } from '@/env'
import { persistDeviceWrappedPassphrase } from '@/lib/crypto'
import { useMeQuery } from '@/services/auth/hooks/auth.hook'
import { documentsKeys, userKeysKeys } from '@/services/queryKeys'

import { rotateEncryptionKeys } from './keyRotation'
import { getMockUserKeys } from './userKeys.mock'
import {
  fetchKeyHistory,
  fetchSecurityActivity,
  fetchUserKeys,
} from './userKeys.query'
import type { RotateEncryptionKeysMutationVars } from './userKeys.type'

const isMockUserKeys = (): boolean => env.VITE_MOCK_USER_KEYS

export { userKeysKeys }

export const useGetUserKeysQuery = () => {
  const { data: me, isPending: isMePending } = useMeQuery()
  const mock = isMockUserKeys()

  return useQuery({
    enabled: !isMePending && me != null,
    queryKey: userKeysKeys.all,
    queryFn: () => (mock ? getMockUserKeys() : fetchUserKeys()),
  })
}

export const usePublicKeyHistoryQuery = () => {
  const { data: me } = useMeQuery()
  const { data: keys } = useGetUserKeysQuery()

  return useQuery({
    enabled: me != null && keys != null,
    queryKey: userKeysKeys.history,
    queryFn: () => fetchKeyHistory(),
  })
}

export const useSecurityActivityQuery = () => {
  const { data: me } = useMeQuery()

  return useQuery({
    enabled: me != null,
    queryKey: userKeysKeys.securityActivity,
    queryFn: () => fetchSecurityActivity(),
  })
}

export const useRotateEncryptionKeysMutation = () => {
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const { data: keys } = useGetUserKeysQuery()
  const { passphrase, setPassphrase } = useEncryptionSession()

  return useMutation({
    mutationKey: userKeysKeys.rotate,
    mutationFn: async ({
      accountPassword,
    }: RotateEncryptionKeysMutationVars) => {
      if (!me?.email || !keys || !passphrase) {
        throw new Error('Missing session or keys')
      }
      return rotateEncryptionKeys({
        tenantId: me.tenantId,
        userId: me.userId,
        accountEmail: me.email,
        accountPassword,
        currentKeys: keys,
        currentPassphrase: passphrase,
      })
    },
    onSuccess: async ({ newPassphrase }) => {
      setPassphrase(newPassphrase)
      await persistDeviceWrappedPassphrase(newPassphrase)
      await queryClient.invalidateQueries({ queryKey: userKeysKeys.all })
      await queryClient.invalidateQueries({ queryKey: userKeysKeys.history })
      await queryClient.invalidateQueries({
        queryKey: userKeysKeys.securityActivity,
      })
      await queryClient.invalidateQueries({ queryKey: documentsKeys.list })
      await queryClient.invalidateQueries({ queryKey: ['tenantSymmetricKey'] })
    },
  })
}
