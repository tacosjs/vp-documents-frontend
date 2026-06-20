import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { m } from '@/paraglide/messages'
import type { useSignIn } from '@/services/auth'
import { RoutesPath } from '@/types/routes'

type SignInCredsFormProps = ReturnType<typeof useSignIn>

export const SignInCredsForm = ({
  email,
  error,
  handleSignIn,
  isLoading,
  password,
  setEmail,
  setPassword,
}: SignInCredsFormProps) => {
  return (
    <form onSubmit={handleSignIn}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">{m['sign_in.email']()}</FieldLabel>
          <Input
            id="email"
            placeholder={m['sign_in.email_placeholder']()}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field>
          <div className="flex items-center gap-2">
            <FieldLabel htmlFor="password">
              {m['sign_in.password']()}
            </FieldLabel>
            <Typography.Link
              className="ml-auto inline-block text-sm"
              to={RoutesPath.FORGOT_PASSWORD.toString()}
              variant="muted"
              underlined
            >
              {m['sign_in.forgot_password']()}
            </Typography.Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldError>{error}</FieldError>
          <Button disabled={isLoading} isLoading={isLoading} type="submit">
            {m['sign_in.button']()}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
