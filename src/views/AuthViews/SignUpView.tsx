import { SignUpCredsForm } from '@/components/Forms/SignUp'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { m } from '@/paraglide/messages'
import { Route } from '@/routes/auth/signup'
import { useSignUp } from '@/services/auth'
import { RoutesPath } from '@/types/routes'

export const SignUpView = () => {
  const { invite } = Route.useSearch()
  const signUp = useSignUp({ inviteToken: invite })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m['sign_up.title']()}</CardTitle>
        <CardDescription>{m['sign_up.description']()}</CardDescription>
        {invite ? (
          <p className="text-muted-foreground text-sm pt-2">
            {m['sign_up.join_via_invite']()}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <SignUpCredsForm {...signUp} />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t pt-6">
        <p className="flex gap-2 text-muted-foreground text-center text-sm">
          {m['sign_up.already_have_account']()}
          <Typography.Link
            to={RoutesPath.SIGN_IN.toString()}
            variant="muted"
            underlined
          >
            {m['sign_up.sign_in']()}
          </Typography.Link>
        </p>
      </CardFooter>
    </Card>
  )
}
