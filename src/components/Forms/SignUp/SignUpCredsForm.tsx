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
import type { useSignUp } from '@/services/auth'

type SignUpCredsFormProps = ReturnType<typeof useSignUp>

export const SignUpCredsForm = ({
  confirmPassword,
  email,
  error,
  handleSignUp,
  isLoading,
  password,
  setConfirmPassword,
  setEmail,
  setPassword,
}: SignUpCredsFormProps) => {
  return (
    <form onSubmit={handleSignUp}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">{m['sign_up.email']()}</FieldLabel>
          <Input
            id="email"
            placeholder={m['sign_up.email_placeholder']()}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FieldDescription className="text-xs">
            {m['sign_up.email_description']()}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">{m['sign_up.password']()}</FieldLabel>
          <Input
            id="password"
            placeholder="************"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FieldDescription className="text-xs">
            {m['sign_up.rules.length']({ num: 12 })}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">
            {m['sign_up.confirm.label']()}
          </FieldLabel>
          <Input
            id="confirm-password"
            placeholder={m['sign_up.confirm.description']()}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Field>
        <FieldGroup>
          <FieldError>{error}</FieldError>
          <Field>
            <Button disabled={isLoading} isLoading={isLoading} type="submit">
              {m['sign_up.button']()}
            </Button>
          </Field>
        </FieldGroup>
      </FieldGroup>
    </form>
  )
}
