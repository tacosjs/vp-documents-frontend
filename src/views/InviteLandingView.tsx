import { useState } from 'react'

import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { ApiHttpError } from '@/lib/http/apiClient'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'
import { useMeQuery } from '@/services/auth'
import {
  useAcceptInvitationMutation,
  useInvitationPreviewQuery,
} from '@/services/tenants'
import { RoutesPath } from '@/types/routes'

const invitedRoleLabel = (role: string): string =>
  role === 'admin'
    ? m['org.invites.role_admin']()
    : m['org.invites.role_editor']()

type InviteLandingViewProps = {
  token: string
}

export const InviteLandingView = ({ token }: InviteLandingViewProps) => {
  const { data: me, isPending: mePending } = useMeQuery()
  const preview = useInvitationPreviewQuery(token)
  const accept = useAcceptInvitationMutation()
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const locale = getLocale()
  const inviteReturnPath = `/invite/${token}`

  const handleAccept = async () => {
    setAcceptError(null)
    try {
      await accept.mutateAsync(token)
    } catch (err) {
      const msg =
        err instanceof ApiHttpError
          ? err.message
          : m['org.invite_landing.accept_error']()
      setAcceptError(msg)
    }
  }

  if (preview.isPending) {
    return (
      <Card>
        <CardContent className="flex justify-center py-10">
          <Spinner className="size-8" />
          <span className="sr-only">{m['org.invite_landing.loading']()}</span>
        </CardContent>
      </Card>
    )
  }

  if (preview.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{m['org.invite_landing.title']()}</CardTitle>
          <CardDescription>{m['org.invite_landing.invalid']()}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { expiresAtMs, role, tenantName } = preview.data
  const expiresDate = new Date(expiresAtMs).toLocaleString(locale)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m['org.invite_landing.title']()}</CardTitle>
        <CardDescription>
          {m['org.invite_landing.organization']({ name: tenantName })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          {m['org.invite_landing.expires']({ date: expiresDate })}
        </p>
        <p className="text-muted-foreground text-sm">
          {m['org.invite_landing.invited_as']({
            role: invitedRoleLabel(role),
          })}
        </p>

        {mePending ? (
          <div className="flex justify-center py-4">
            <Spinner className="size-6" />
          </div>
        ) : !me ? (
          <>
            <p className="text-sm">
              {m['org.invite_landing.signed_out_hint']()}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="w-full sm:flex-1" asChild>
                <Link
                  search={{ invite: token }}
                  to={RoutesPath.SIGN_UP.toString()}
                >
                  {m['org.invite_landing.create_account']()}
                </Link>
              </Button>
              <Button className="w-full sm:flex-1" variant="outline" asChild>
                <Link
                  search={{ redirect: inviteReturnPath }}
                  to={RoutesPath.SIGN_IN.toString()}
                >
                  {m['org.invite_landing.sign_in']()}
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            {me.tenantId ? (
              <p className="text-muted-foreground text-sm">
                {m['org.invite_landing.has_workspace']()}
              </p>
            ) : null}
            {acceptError ? (
              <p className="text-destructive text-sm" role="alert">
                {acceptError}
              </p>
            ) : null}
            <Button
              className="w-full"
              disabled={accept.isPending}
              type="button"
              onClick={() => void handleAccept()}
            >
              {accept.isPending ? (
                <>
                  <Spinner className="size-4" />
                  <span className="ms-2">
                    {m['org.invite_landing.joining']()}
                  </span>
                </>
              ) : (
                m['org.invite_landing.join']()
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
