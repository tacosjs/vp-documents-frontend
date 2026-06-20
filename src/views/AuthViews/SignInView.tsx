import { Link } from '@tanstack/react-router'

import { SignInCredsForm } from '@/components/Forms/SignIn'
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
import { Route } from '@/routes/auth/signin'
import { useSignIn } from '@/services/auth'
import { RoutesPath } from '@/types/routes'

export const SignInView = () => {
  const { redirect } = Route.useSearch()
  const signIn = useSignIn({ redirectAfterLogin: redirect })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m['sign_in.title']()}</CardTitle>
        <CardDescription>{m['sign_in.description']()}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInCredsForm {...signIn} />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t pt-6">
        <p className="flex gap-2 text-muted-foreground text-center text-sm">
          {m['sign_in.no_account']()}
          <Typography.Link
            to={RoutesPath.SIGN_UP.toString()}
            variant="muted"
            underlined
          >
            {m['sign_in.sign_up']()}
          </Typography.Link>
        </p>
      </CardFooter>
    </Card>
  )
}
