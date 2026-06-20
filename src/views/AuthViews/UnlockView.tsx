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
import { m } from '@/paraglide/messages'
import { useSignOut, useUnlockEncryption } from '@/services/auth'

export const UnlockView = () => {
  const { signOut } = useSignOut()
  const { error, handleUnlock, isLoading, password, setPassword } =
    useUnlockEncryption()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m['unlock.title']()}</CardTitle>
        <CardDescription>{m['unlock.description']()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleUnlock}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="unlock-password">
                {m['unlock.password_label']()}
              </FieldLabel>
              <FieldDescription>
                {m['unlock.password_description']()}
              </FieldDescription>
              <Input
                id="unlock-password"
                autoComplete="current-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
          <Button disabled={isLoading} isLoading={isLoading} type="submit">
            {m['unlock.button']()}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t pt-6">
        <p className="text-muted-foreground text-center text-sm">
          <button
            className="underline-offset-4 hover:underline"
            onClick={() => signOut()}
          >
            {m['unlock.logout']()}
          </button>
        </p>
      </CardFooter>
    </Card>
  )
}
