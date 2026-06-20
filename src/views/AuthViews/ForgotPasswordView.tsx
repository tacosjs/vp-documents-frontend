import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import { m } from '@/paraglide/messages'
import { useForgotPassword } from '@/services/auth'
import { RoutesPath } from '@/types/routes'

export const ForgotPasswordView = () => {
  const fp = useForgotPassword()

  if (fp.done) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{m['forgot_password.title']()}</CardTitle>
          <CardDescription>{m['forgot_password.done']()}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 border-t pt-6">
          <Button className="w-full" type="button" onClick={fp.goToSignIn}>
            {m['forgot_password.back_to_sign_in']()}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m['forgot_password.title']()}</CardTitle>
        <CardDescription>{m['forgot_password.description']()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={fp.handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fp-email">
                {m['forgot_password.email']()}
              </FieldLabel>
              <Input
                id="fp-email"
                autoComplete="email"
                placeholder={m['forgot_password.email_placeholder']()}
                type="email"
                value={fp.email}
                onChange={(e) => fp.setEmail(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fp-recovery">
                {m['forgot_password.recovery_phrase']()}
              </FieldLabel>
              <FieldDescription>
                {m['forgot_password.recovery']()}
              </FieldDescription>
              <Textarea
                id="fp-recovery"
                autoComplete="off"
                className="min-h-[88px] resize-y"
                placeholder={m['forgot_password.recovery_placeholder']()}
                value={fp.recoveryPhrase}
                onChange={(e) => fp.setRecoveryPhrase(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fp-new">
                {m['forgot_password.new_password']()}
              </FieldLabel>
              <Input
                id="fp-new"
                autoComplete="new-password"
                type="password"
                value={fp.newPassword}
                onChange={(e) => fp.setNewPassword(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fp-confirm">
                {m['forgot_password.confirm_password']()}
              </FieldLabel>
              <Input
                id="fp-confirm"
                autoComplete="new-password"
                type="password"
                value={fp.confirmPassword}
                onChange={(e) => fp.setConfirmPassword(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldError>{fp.error}</FieldError>
              <Button
                disabled={fp.isLoading}
                isLoading={fp.isLoading}
                type="submit"
              >
                {fp.isLoading
                  ? m['forgot_password.submitting']()
                  : m['forgot_password.submit']()}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t pt-6">
        <p className="flex gap-2 text-muted-foreground text-center text-sm">
          <Typography.Link
            to={RoutesPath.SIGN_IN.toString()}
            variant="muted"
            underlined
          >
            {m['forgot_password.back_to_sign_in']()}
          </Typography.Link>
        </p>
      </CardFooter>
    </Card>
  )
}
