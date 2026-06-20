import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { ApiHttpError } from '@/lib/http/apiClient'
import { m } from '@/paraglide/messages'
import { useMeQuery } from '@/services/auth'
import { tenantKeys } from '@/services/queryKeys'
import {
  distributeWorkspaceKeyToMembers,
  generateAndUploadWorkspaceKeyForMembers,
  useTenantSymmetricKeyQuery,
} from '@/services/tenantKey'
import { listMembers } from '@/services/tenants'
import { useGetUserKeysQuery } from '@/services/userKeys'

export const OrganizationKeyCard = () => {
  const { data: me } = useMeQuery()
  const { encryptionUnlockId, passphrase } = useEncryptionSession()
  const { data: keys, isPending: keysPending } = useGetUserKeysQuery()
  const tenantId = me?.tenantId ?? null
  const encryptionReady = Boolean(
    tenantId && encryptionUnlockId && keys && passphrase,
  )

  const tskQuery = useTenantSymmetricKeyQuery()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationKey: tenantKeys.organizationKeyGenerate,
    mutationFn: async () => {
      if (!tenantId) throw new Error('No tenant')
      const members = await listMembers(tenantId, { includePublicKeys: true })
      if (members.length === 0) throw new Error('No members')
      await generateAndUploadWorkspaceKeyForMembers(tenantId, members)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tenantSymmetricKey'] })
      await queryClient.invalidateQueries({
        queryKey: ['organizationKeyMissingWraps'],
      })
    },
  })

  const syncMutation = useMutation({
    mutationKey: tenantKeys.organizationKeySync,
    mutationFn: async () => {
      if (!tenantId) throw new Error('No tenant')
      const tsk = tskQuery.data
      if (!tsk) throw new Error('No organization key')
      const members = await listMembers(tenantId, { includePublicKeys: true })
      await distributeWorkspaceKeyToMembers(tenantId, tsk, members)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tenantSymmetricKey'] })
      await queryClient.invalidateQueries({
        queryKey: ['organizationKeyMissingWraps'],
      })
    },
  })

  if (!tenantId) return null

  if (keysPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{m['org.organization_key.title']()}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground text-sm">
          <Spinner className="size-4" />
          {m['org.organization_key.loading_keys']()}
        </CardContent>
      </Card>
    )
  }

  if (!encryptionReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{m['org.organization_key.title']()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {m['org.organization_key.unlock_first']()}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (tskQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{m['org.organization_key.title']()}</CardTitle>
          <CardDescription>
            {m['org.organization_key.description']()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground text-sm">
          <Spinner className="size-4" />
        </CardContent>
      </Card>
    )
  }

  if (tskQuery.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{m['org.organization_key.title']()}</CardTitle>
          <CardDescription>
            {m['org.organization_key.active']()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm">
            {m['org.organization_key.sync_description']()}
          </p>
          <Button
            disabled={syncMutation.isPending}
            type="button"
            variant="secondary"
            onClick={() => void syncMutation.mutateAsync()}
          >
            {syncMutation.isPending
              ? m['org.organization_key.syncing']()
              : m['org.organization_key.sync']()}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const err = tskQuery.error

  if (err instanceof ApiHttpError && err.status === 404) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{m['org.organization_key.title']()}</CardTitle>
          <CardDescription>
            {m['org.organization_key.description']()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            disabled={mutation.isPending}
            type="button"
            onClick={() => void mutation.mutateAsync()}
          >
            {mutation.isPending
              ? m['org.organization_key.generating']()
              : m['org.organization_key.generate']()}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m['org.organization_key.title']()}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-destructive text-sm" role="alert">
          {err instanceof Error ? err.message : 'Error'}
        </p>
      </CardContent>
    </Card>
  )
}
