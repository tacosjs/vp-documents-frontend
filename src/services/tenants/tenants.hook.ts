import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { env } from '@/env'
import type { Me } from '@/services/auth'
import { useMeQuery } from '@/services/auth'
import { mockAcceptInvitation } from '@/services/auth/auth.mock'
import { authKeys, tenantKeys } from '@/services/queryKeys'
import { RoutesPath } from '@/types/routes'

import { getMockInvitationPreview, getMockTenantMembers } from './tenants.mock'
import {
  acceptInvitation,
  createInvitation,
  createTenant,
  listMembers,
  patchMemberRole,
  previewInvitation,
  removeMember,
  validateMemberOrganizationAccess,
} from './tenants.query'
import type {
  CreateInvitationBody,
  CreateTenantBody,
  PatchMemberRoleBody,
} from './tenants.type'

const isMockAuth = (): boolean => env.VITE_MOCK_AUTH

export function useCreateTenantMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTenantBody) => createTenant(body),
    onSuccess: async (tenant) => {
      queryClient.setQueryData<Me | null>(authKeys.me, (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tenantId: tenant.id,
          organizationAccessPendingValidation: false,
          tenantName: tenant.name,
          tenantRole: tenant.role,
        }
      })
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useCreateInvitationMutation(tenantId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateInvitationBody) => {
      if (!tenantId) {
        throw new Error('No active tenant')
      }
      return createInvitation(tenantId, body)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useInvitationPreviewQuery(token: string | undefined) {
  const mock = isMockAuth()
  const t = token?.trim() ?? ''
  return useQuery({
    enabled: t.length > 0,
    queryKey: tenantKeys.invitationPreview(t),
    queryFn: () => (mock ? getMockInvitationPreview(t) : previewInvitation(t)),
  })
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mock = isMockAuth()

  return useMutation({
    mutationFn: (inviteToken: string) =>
      mock ? mockAcceptInvitation() : acceptInvitation(inviteToken.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
      navigate({ to: RoutesPath.HOME.toString() })
    },
  })
}

export function useTenantMembersQuery() {
  const { data: me, isPending: isMePending } = useMeQuery()
  const mock = isMockAuth()
  const tenantId = me?.tenantId ?? ''
  const isAdmin = me?.tenantRole === 'admin'

  return useQuery({
    enabled: Boolean(tenantId && isAdmin && !isMePending),
    queryKey: tenantKeys.members(tenantId),
    queryFn: () => {
      if (!tenantId) {
        throw new Error('No active tenant')
      }
      return mock ? getMockTenantMembers() : listMembers(tenantId)
    },
  })
}

export function usePatchMemberRoleMutation(tenantId: string | null) {
  const queryClient = useQueryClient()
  const mock = isMockAuth()

  return useMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: string
      body: PatchMemberRoleBody
    }) => {
      if (!tenantId) {
        throw new Error('No active tenant')
      }
      return mock ? Promise.resolve() : patchMemberRole(tenantId, userId, body)
    },
    onSuccess: async () => {
      if (tenantId) {
        await queryClient.invalidateQueries({
          queryKey: tenantKeys.members(tenantId),
        })
      }
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useRemoveMemberMutation(tenantId: string | null) {
  const queryClient = useQueryClient()
  const mock = isMockAuth()

  return useMutation({
    mutationFn: (userId: string) => {
      if (!tenantId) {
        throw new Error('No active tenant')
      }
      return mock ? Promise.resolve() : removeMember(tenantId, userId)
    },
    onSuccess: async () => {
      if (tenantId) {
        await queryClient.invalidateQueries({
          queryKey: tenantKeys.members(tenantId),
        })
      }
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useValidateMemberOrganizationAccessMutation(
  tenantId: string | null,
) {
  const queryClient = useQueryClient()
  const mock = isMockAuth()

  return useMutation({
    mutationFn: (userId: string) => {
      if (!tenantId) {
        throw new Error('No active tenant')
      }
      return mock
        ? Promise.resolve()
        : validateMemberOrganizationAccess(tenantId, userId)
    },
    onSuccess: async () => {
      if (tenantId) {
        await queryClient.invalidateQueries({
          queryKey: tenantKeys.members(tenantId),
        })
        await queryClient.invalidateQueries({
          queryKey: ['organizationKeyMissingWraps'],
        })
      }
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}
