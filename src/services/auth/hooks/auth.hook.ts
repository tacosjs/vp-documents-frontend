import { useState } from 'react'
import type { FormEvent } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { env } from '@/env'
import { isSafeAppRedirectPath, withFormSubmit } from '@/hooks/auth.helpers'
import {
  clearDeviceWrapOnLogout,
  createPassphrase,
  decryptPassphrase,
  encryptPassphrase,
  generateKeyPair,
  hashRecoveryPhraseSha256Hex,
  normalizeRecoveryPhrase,
  persistDeviceWrappedPassphrase,
} from '@/lib/crypto'
import { m } from '@/paraglide/messages'
import { getLocale, locales } from '@/paraglide/runtime'
import { clearMockDocumentsState } from '@/services/documents/documents.mock'
import { authKeys, documentsKeys, userKeysKeys } from '@/services/queryKeys'
import {
  clearMockUserKeysState,
  getMockUserKeys,
  seedMockUserKeys,
} from '@/services/userKeys/userKeys.mock'
import { fetchUserKeys } from '@/services/userKeys/userKeys.query'
import { RoutesPath } from '@/types/routes'

import { useAuthQuery } from '../adapters/auth.query'
import type { PatchMeBody } from '../adapters/auth.query'
import {
  completeAccountPasswordRecovery,
  verifyAccountRecovery,
} from '../adapters/auth.recovery.query'
import * as authMock from '../auth.mock'
import type {
  SignInMfaFormProps,
  SignUpVerificationFormProps,
} from '../auth.type'

const isMockAuth = (): boolean => env.VITE_MOCK_AUTH

const isMockUserKeys = (): boolean => env.VITE_MOCK_USER_KEYS

export { authKeys }

export const useMeQuery = () => {
  const auth = useAuthQuery()
  const mock = isMockAuth()
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => (mock ? authMock.getMockMe() : auth.fetchMe()),
  })
}

export const usePatchMeMutation = () => {
  const auth = useAuthQuery()
  const queryClient = useQueryClient()
  const mock = isMockAuth()

  return useMutation({
    mutationFn: (body: PatchMeBody) =>
      mock ? authMock.mockPatchMe(body) : auth.patchMe(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export const useLogoutMutation = () => {
  const auth = useAuthQuery()
  const queryClient = useQueryClient()
  const { clearEncryptionSession } = useEncryptionSession()
  const mock = isMockAuth()

  return useMutation({
    mutationFn: () =>
      mock ? authMock.mockLogoutMutation() : auth.postLogout(),
    onSettled: async () => {
      clearMockUserKeysState()
      clearMockDocumentsState()
      clearEncryptionSession()
      clearDeviceWrapOnLogout()
      await queryClient.removeQueries({ queryKey: ['tenantSymmetricKey'] })
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
      await queryClient.invalidateQueries({ queryKey: documentsKeys.all })
      await queryClient.invalidateQueries({ queryKey: userKeysKeys.all })
    },
  })
}

export const useDeleteAccountMutation = () => {
  const auth = useAuthQuery()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { clearEncryptionSession } = useEncryptionSession()
  const mock = isMockAuth()

  return useMutation({
    mutationFn: () => (mock ? authMock.mockDeleteAccount() : auth.deleteMe()),
    onSuccess: async () => {
      clearMockUserKeysState()
      clearMockDocumentsState()
      clearEncryptionSession()
      clearDeviceWrapOnLogout()
      await queryClient.removeQueries({ queryKey: ['tenantSymmetricKey'] })
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
      await queryClient.invalidateQueries({ queryKey: documentsKeys.all })
      await queryClient.invalidateQueries({ queryKey: userKeysKeys.all })
      if (!mock) {
        try {
          await auth.postLogout()
        } catch {
          /* session may already be gone */
        }
      }
      await navigate({ to: RoutesPath.SIGN_IN })
    },
  })
}

export const useSignOut = () => {
  const { mutateAsync: signOut } = useLogoutMutation()
  return { signOut }
}

export const useSignIn = (options?: {
  redirectAfterLogin?: string | undefined
}) => {
  const navigate = useNavigate()
  const auth = useAuthQuery()
  const queryClient = useQueryClient()
  const { setEncryptionUnlockId, setPassphrase } = useEncryptionSession()
  const redirectAfterLogin = options?.redirectAfterLogin

  const mockAuth = isMockAuth()
  const mockKeys = isMockUserKeys()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim()) return

    await withFormSubmit(
      async () => {
        if (mockAuth) {
          await authMock.mockCompleteSrpLogin(email, password)
        } else {
          await auth.completeSrpLogin(email, password)
        }

        const loc = getLocale()
        if (locales.includes(loc)) {
          if (mockAuth) {
            await authMock.mockPatchMe({ preferred_locale: loc })
          } else {
            await auth.patchMe({ preferred_locale: loc })
          }
        }

        await queryClient.invalidateQueries({ queryKey: authKeys.me })
        await queryClient.fetchQuery({
          queryKey: authKeys.me,
          queryFn: () => (mockAuth ? authMock.getMockMe() : auth.fetchMe()),
        })

        const keys = await queryClient.fetchQuery({
          queryKey: userKeysKeys.all,
          queryFn: () => (mockKeys ? getMockUserKeys() : fetchUserKeys()),
        })

        const decryptedPassphrase = await decryptPassphrase(
          keys.encryptedPassphrase,
          password,
        )
        setPassphrase(decryptedPassphrase)
        setEncryptionUnlockId(crypto.randomUUID())
        await persistDeviceWrappedPassphrase(decryptedPassphrase)
        const nextTo =
          redirectAfterLogin && isSafeAppRedirectPath(redirectAfterLogin)
            ? redirectAfterLogin
            : RoutesPath.HOME.toString()
        navigate({ to: nextTo })
      },
      { fallbackMessage: 'Sign in failed', setError, setIsLoading },
    )
  }

  return {
    email,
    error,
    handleSignIn,
    isLoading,
    password,
    setEmail,
    setPassword,
  }
}

export const useSignUp = (options?: { inviteToken?: string }) => {
  const navigate = useNavigate()
  const auth = useAuthQuery()
  const queryClient = useQueryClient()
  const { setEncryptionUnlockId, setPassphrase } = useEncryptionSession()
  const inviteToken = options?.inviteToken

  const mockAuth = isMockAuth()
  const mockKeys = isMockUserKeys()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    await withFormSubmit(
      async () => {
        const passphrase = createPassphrase()
        const encryptedPassphrase = await encryptPassphrase(
          passphrase,
          password,
        )
        const { privateKey, publicKey } = await generateKeyPair(
          email.trim(),
          passphrase,
        )

        const keyMaterial = {
          encryptedPassphrase,
          encryptedPrivateKey: privateKey,
          publicKey,
        }

        const recoveryPhraseSha256 =
          await hashRecoveryPhraseSha256Hex(passphrase)

        if (mockAuth) {
          await authMock.mockRegisterWithSrp()
          await authMock.mockCompleteSrpLogin(email.trim(), password)
          await authMock.recordMockAccountRecoveryMaterial(
            email.trim(),
            recoveryPhraseSha256,
          )
        } else {
          await auth.registerWithSrp(
            email.trim(),
            password,
            keyMaterial,
            recoveryPhraseSha256,
            inviteToken ? { inviteToken } : undefined,
          )
          await auth.completeSrpLogin(email.trim(), password)
        }

        if (mockKeys) {
          seedMockUserKeys(keyMaterial)
        }

        const loc = getLocale()
        if (locales.includes(loc)) {
          if (mockAuth) {
            await authMock.mockPatchMe({ preferred_locale: loc })
          } else {
            await auth.patchMe({ preferred_locale: loc })
          }
        }

        await queryClient.invalidateQueries({ queryKey: authKeys.me })
        await queryClient.invalidateQueries({ queryKey: userKeysKeys.all })
        await queryClient.fetchQuery({
          queryKey: authKeys.me,
          queryFn: () => (mockAuth ? authMock.getMockMe() : auth.fetchMe()),
        })

        setPassphrase(passphrase)
        setEncryptionUnlockId(crypto.randomUUID())
        await persistDeviceWrappedPassphrase(passphrase)
        navigate({ to: RoutesPath.HOME.toString() })
      },
      {
        fallbackMessage: 'Sign up failed',
        setError,
        setIsLoading,
      },
    )
  }

  return {
    confirmPassword,
    email,
    error,
    handleSignUp,
    isLoading,
    password,
    setConfirmPassword,
    setEmail,
    setPassword,
  }
}

export const useForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [recoveryPhrase, setRecoveryPhrase] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError(m['forgot_password.passwords_mismatch']())
      return
    }
    await withFormSubmit(
      async () => {
        const normalized = normalizeRecoveryPhrase(recoveryPhrase)
        if (!normalized) {
          throw new Error(m['forgot_password.error']())
        }
        const { recoveryToken } = await verifyAccountRecovery({
          email,
          recoveryPhrase,
        })
        await completeAccountPasswordRecovery({
          dataPassphrase: normalized,
          email,
          newPassword,
          recoveryToken,
        })
        setDone(true)
      },
      {
        fallbackMessage: m['forgot_password.error'](),
        setError,
        setIsLoading,
      },
    )
  }

  return {
    confirmPassword,
    done,
    email,
    error,
    handleSubmit,
    isLoading,
    newPassword,
    recoveryPhrase,
    setConfirmPassword,
    setEmail,
    setNewPassword,
    setRecoveryPhrase,
    goToSignIn: () => {
      navigate({ to: RoutesPath.SIGN_IN.toString() })
    },
  }
}

/** Re-decrypt local encryption keys after a full reload (session cookie still valid). */
export const useUnlockEncryption = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setEncryptionUnlockId, setPassphrase } = useEncryptionSession()

  const mockKeys = isMockUserKeys()

  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnlock = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await withFormSubmit(
      async () => {
        const keys = await queryClient.fetchQuery({
          queryKey: userKeysKeys.all,
          queryFn: () => (mockKeys ? getMockUserKeys() : fetchUserKeys()),
        })
        const decryptedPassphrase = await decryptPassphrase(
          keys.encryptedPassphrase,
          password,
        )
        setPassphrase(decryptedPassphrase)
        setEncryptionUnlockId(crypto.randomUUID())
        await persistDeviceWrappedPassphrase(decryptedPassphrase)
        navigate({ to: RoutesPath.HOME.toString() })
      },
      { fallbackMessage: 'Unlock failed', setError, setIsLoading },
    )
  }

  return {
    error,
    handleUnlock,
    isLoading,
    password,
    setPassword,
  }
}

/** Placeholder UI state until MFA is wired to the auth API. */
export const useSignInMfaForm = (): SignInMfaFormProps => {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMfaVerify = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(false)
    setError('Multi-factor authentication is not enabled yet.')
  }

  return {
    code,
    error,
    handleMfaVerify,
    isLoading,
    setCode,
  }
}

/** Placeholder UI state until email verification is wired to the auth API. */
export const useSignUpVerificationForm = (
  email: string,
): SignUpVerificationFormProps => {
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerification = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(false)
    setError('Email verification is not implemented yet.')
  }

  return {
    email,
    error,
    handleVerification,
    isLoading,
    setVerificationCode,
    verificationCode,
  }
}
