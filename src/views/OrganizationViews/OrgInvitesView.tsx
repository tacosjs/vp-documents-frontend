import { useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { ApiHttpError } from '@/lib/http/apiClient'
import { m } from '@/paraglide/messages'
import { useMeQuery } from '@/services/auth'
import { tenantKeys } from '@/services/queryKeys'
import {
  distributeWorkspaceKeyToMembers,
  useTenantSymmetricKeyQuery,
} from '@/services/tenantKey'
import type { TenantMember } from '@/services/tenants'
import {
  listMembers,
  useCreateInvitationMutation,
  usePatchMemberRoleMutation,
  useRemoveMemberMutation,
  useTenantMembersQuery,
} from '@/services/tenants'

const DEFAULT_EXPIRES_SEC = 7 * 24 * 3600

const isSoleAdmin = (
  member: TenantMember,
  members: Array<TenantMember>,
): boolean => {
  if (member.role !== 'admin') return false
  const admins = members.filter((row) => row.role === 'admin').length
  return admins <= 1
}

export const TeamInvitesView = () => {
  const { data: me } = useMeQuery()
  const queryClient = useQueryClient()
  const tenantId = me?.tenantId ?? null
  const isAdmin = me?.tenantRole === 'admin'

  const membersQuery = useTenantMembersQuery()
  const patchRole = usePatchMemberRoleMutation(tenantId)
  const removeMember = useRemoveMemberMutation(tenantId)
  const createInvitation = useCreateInvitationMutation(tenantId)
  const [grantPending, setGrantPending] = useState(false)
  const tskQuery = useTenantSymmetricKeyQuery()

  const [role, setRole] = useState<'admin' | 'editor'>('editor')
  const [expiresInSeconds, setExpiresInSeconds] = useState(
    String(DEFAULT_EXPIRES_SEC),
  )
  const [result, setResult] = useState<{
    inviteUrl: string
    token: string
  } | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'url' | 'token' | null>(null)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [grantError, setGrantError] = useState<string | null>(null)

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setInviteError(null)
    setResult(null)
    const secs = Number.parseInt(expiresInSeconds, 10)
    if (!Number.isFinite(secs) || secs < 60) {
      setInviteError(m['org.invites.error_expires']())
      return
    }
    try {
      const res = await createInvitation.mutateAsync({
        expiresInSeconds: secs,
        role,
      })
      setResult({ inviteUrl: res.inviteUrl, token: res.token })
    } catch {
      setInviteError(m['org.invites.error_create']())
    }
  }

  const copyText = async (kind: 'url' | 'token', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
    }
  }

  const handleRoleChange = async (
    member: TenantMember,
    next: 'admin' | 'editor',
  ) => {
    if (member.role === next) return
    setMemberError(null)
    try {
      await patchRole.mutateAsync({
        userId: member.userId,
        body: { role: next },
      })
    } catch (err) {
      const fallback = m['org.members.error_role']()
      if (err instanceof ApiHttpError && err.status === 409) {
        setMemberError(m['org.members.error_conflict']())
      } else {
        setMemberError(err instanceof ApiHttpError ? err.message : fallback)
      }
    }
  }

  const handleGrantOrganizationAccess = async (member: TenantMember) => {
    if (!tenantId) return
    setGrantError(null)
    setGrantPending(true)
    try {
      const tsk = tskQuery.data
      if (tsk) {
        const fresh = await listMembers(tenantId, { includePublicKeys: true })
        const row = fresh.find(
          (candidate) => candidate.userId === member.userId,
        )
        if (row?.publicKey.trim()) {
          await distributeWorkspaceKeyToMembers(tenantId, tsk, [row])
        }
        await queryClient.invalidateQueries({
          queryKey: tenantKeys.members(tenantId),
        })
        await queryClient.invalidateQueries({
          queryKey: ['organizationKeyMissingWraps'],
        })
      }
    } catch (err) {
      setGrantError(
        err instanceof ApiHttpError
          ? err.message
          : m['org.members.grant_organization_access_error'](),
      )
    } finally {
      setGrantPending(false)
    }
  }

  const handleRemove = async (member: TenantMember) => {
    if (!window.confirm(m['org.members.confirm_remove']())) return
    setMemberError(null)
    try {
      await removeMember.mutateAsync(member.userId)
    } catch (err) {
      const fallback = m['org.members.error_remove']()
      if (err instanceof ApiHttpError && err.status === 409) {
        setMemberError(m['org.members.error_conflict']())
      } else {
        setMemberError(err instanceof ApiHttpError ? err.message : fallback)
      }
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{m['org.invites.admin_only']()}</p>
      </div>
    )
  }

  const members = membersQuery.data ?? []

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-title text-2xl font-bold uppercase">
          {m['org.invites.title']()}
        </h1>
        <p className="text-muted-foreground text-sm">
          {m['org.invites.subtitle']()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{m['org.members.title']()}</CardTitle>
          <CardDescription>{m['org.members.subtitle']()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {grantError ? (
            <p className="text-destructive text-sm" role="alert">
              {grantError}
            </p>
          ) : null}
          {membersQuery.isPending ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Spinner className="size-4" />
              {m['org.members.loading']()}
            </div>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {m['org.members.empty']()}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((member) => {
                const sole = isSoleAdmin(member, members)
                return (
                  <li
                    key={member.userId}
                    className="flex flex-col gap-2 border-b border-border pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {member.email}
                        {member.userId === me.userId ? (
                          <span className="text-muted-foreground font-normal">
                            {' '}
                            ({m['org.members.you']()})
                          </span>
                        ) : null}
                      </p>
                      {!member.accessValidated ? (
                        <p className="text-muted-foreground text-xs">
                          {m['org.members.pending_access']()}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!member.accessValidated &&
                      member.userId !== me.userId ? (
                        <Button
                          disabled={grantPending}
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            void handleGrantOrganizationAccess(member)
                          }
                        >
                          {grantPending
                            ? m[
                                'org.members.grant_organization_access_pending'
                              ]()
                            : m['org.members.grant_organization_access']()}
                        </Button>
                      ) : null}
                      <Select
                        disabled={patchRole.isPending}
                        value={member.role}
                        onValueChange={(v) =>
                          void handleRoleChange(member, v as 'admin' | 'editor')
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem disabled={sole} value="editor">
                            {m['org.invites.role_editor']()}
                          </SelectItem>
                          <SelectItem value="admin">
                            {m['org.invites.role_admin']()}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        disabled={sole || removeMember.isPending}
                        type="button"
                        variant="destructive"
                        onClick={() => void handleRemove(member)}
                      >
                        {m['org.members.remove']()}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {memberError ? (
            <p className="text-destructive text-sm" role="alert">
              {memberError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m['org.invites.card_title']()}</CardTitle>
          <CardDescription>
            {m['org.invites.card_description']()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>{m['org.invites.role_label']()}</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as 'admin' | 'editor')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    {m['org.invites.role_editor']()}
                  </SelectItem>
                  <SelectItem value="admin">
                    {m['org.invites.role_admin']()}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">
                {m['org.invites.expires_label']()}
              </Label>
              <Input
                id="expires"
                min={60}
                type="number"
                value={expiresInSeconds}
                onChange={(ev) => setExpiresInSeconds(ev.target.value)}
              />
            </div>
            {inviteError ? (
              <p className="text-destructive text-sm" role="alert">
                {inviteError}
              </p>
            ) : null}
            <Button disabled={createInvitation.isPending} type="submit">
              {createInvitation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                m['org.invites.generate']()
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>{m['org.invites.result_title']()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{m['org.invites.link_label']()}</Label>
              <div className="flex gap-2">
                <Input
                  className="font-mono text-xs"
                  value={result.inviteUrl}
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyText('url', result.inviteUrl)}
                >
                  {copied === 'url'
                    ? m['org.invites.copied']()
                    : m['org.invites.copy']()}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{m['org.invites.token_label']()}</Label>
              <div className="flex gap-2">
                <Input
                  className="font-mono text-xs"
                  value={result.token}
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyText('token', result.token)}
                >
                  {copied === 'token'
                    ? m['org.invites.copied']()
                    : m['org.invites.copy']()}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
