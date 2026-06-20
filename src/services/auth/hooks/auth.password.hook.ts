import { useMutation, useQueryClient } from '@tanstack/react-query'

import { env } from '@/env'
import { authKeys, userKeysKeys } from '@/services/queryKeys'
import { recordMockPasswordChange } from '@/services/userKeys/userKeys.mock'
import { fetchUserKeys } from '@/services/userKeys/userKeys.query'

import { changeAccountPassword } from '../adapters/auth.password.query'
import * as authMock from '../auth.mock'

const isMockAuth = (): boolean => env.VITE_MOCK_AUTH

const isMockUserKeys = (): boolean => env.VITE_MOCK_USER_KEYS

export type ChangeAccountPasswordVars = {
  dataPassphrase: string
  email: string
  newPassword: string
  oldPassword: string
}

export const useChangeAccountPasswordMutation = () => {
  const queryClient = useQueryClient()
  const mock = isMockAuth()

  return useMutation({
    mutationFn: async (vars: ChangeAccountPasswordVars) => {
      if (mock) {
        await authMock.mockChangeAccountPassword(vars.newPassword)
        if (isMockUserKeys()) {
          recordMockPasswordChange()
        }
        return
      }
      const keys = await fetchUserKeys()
      await changeAccountPassword({
        dataPassphrase: vars.dataPassphrase,
        email: vars.email,
        encryptedPassphrase: keys.encryptedPassphrase,
        newPassword: vars.newPassword,
        oldPassword: vars.oldPassword,
      })
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
