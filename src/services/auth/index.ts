export { isChangePasswordWrongPasswordError } from './adapters/auth.password.query'

export { useAuthQuery } from './adapters/auth.query'
export {
  completeSrpLogin,
  normalizeEmail,
  registerWithSrp,
} from './adapters/auth.srp'

export type {
  Me,
  RegisterKeyMaterial,
  SignInMfaFormProps,
  SignUpVerificationFormProps,
} from './auth.type'

export {
  authKeys,
  useDeleteAccountMutation,
  useForgotPassword,
  useLogoutMutation,
  useMeQuery,
  usePatchMeMutation,
  useSignIn,
  useSignInMfaForm,
  useSignOut,
  useSignUp,
  useSignUpVerificationForm,
  useUnlockEncryption,
} from './hooks/auth.hook'

export { useChangeAccountPasswordMutation } from './hooks/auth.password.hook'

export type { ChangeAccountPasswordVars } from './hooks/auth.password.hook'
