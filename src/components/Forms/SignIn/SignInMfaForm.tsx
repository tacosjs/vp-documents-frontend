import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { m } from '@/paraglide/messages'
import type { SignInMfaFormProps } from '@/services/auth'

export const SignInMfaForm = ({
  code,
  error,
  handleMfaVerify,
  isLoading,
  setCode,
}: SignInMfaFormProps) => {
  return (
    <form onSubmit={handleMfaVerify}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="code">{m['sign_in.mfa.code']()}</FieldLabel>
          <Input
            id="code"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <FieldError>{error}</FieldError>
        </Field>
        <Field>
          <Button disabled={isLoading} isLoading={isLoading} type="submit">
            {m['sign_in.mfa.verify']()}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
