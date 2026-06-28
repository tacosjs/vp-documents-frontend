import { useMutation, useQueryClient } from '@tanstack/react-query'

import { env } from '@/env'
import { authKeys, userKeysKeys } from '@/services/queryKeys'
import { recordMockPasswordChange } from '@/services/userKeys/userKeys.mock'
import { RoutesPath } from '@/types/routes'

import { initiatePasswordChange } from '../adapters/auth.password.query'
import * as authMock from '../auth.mock'

const isMockAuth = (): boolean => env.VITE_MOCK_AUTH

const isMockUserKeys = (): boolean => env.VITE_MOCK_USER_KEYS

/**
 * Initiates a password change via the API. The server delivers a change token
 * out-of-band (e.g. email). Call `applyAccountPasswordChange` with that token
 * to complete the flow.
 */
export const useInitiatePasswordChangeMutation = () => {
  const queryClient = useQueryClient()
  const mock = isMockAuth()

  return useMutation({
    mutationFn: async () => {
      if (mock) {
        if (isMockUserKeys()) {
          recordMockPasswordChange()
        }
        return
      }
      await initiatePasswordChange()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeysKeys.all })
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
      await queryClient.invalidateQueries({
        queryKey: userKeysKeys.securityActivity,
      })
      await queryClient.invalidateQueries({ queryKey: userKeysKeys.history })
    },
  })
}

export const passwordChangeCallbackPath = RoutesPath.SIGN_IN
