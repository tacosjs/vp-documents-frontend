import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { m } from '@/paraglide/messages'
import type { SignUpVerificationFormProps } from '@/services/auth'

export const SignUpVerificationForm = ({
  email,
  error,
  handleVerification,
  isLoading,
  setVerificationCode,
  verificationCode,
}: SignUpVerificationFormProps) => {
  return (
    <form onSubmit={handleVerification}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="verification-code">
            {m['sign_up.verify.label']()}
          </FieldLabel>
          <FieldDescription className="text-xs">
            {m['sign_up.verify.description']({ email })}
          </FieldDescription>
          <Input
            id="verification-code"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
          />
          <FieldError>{error}</FieldError>
        </Field>
        <Field>
          <Button disabled={isLoading} isLoading={isLoading} type="submit">
            {m['sign_up.verify.button']()}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
