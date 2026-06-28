import { apiJson } from '@/lib/http/apiClient'

import type {
  CreateInvitationBody,
  CreateInvitationResult,
  CreateTenantBody,
  InvitationPreview,
  PatchMemberRoleBody,
  TenantMember,
  TenantSummary,
} from './tenants.type'

function normalizeTenant(row: {
  id: string
  name: string
  role: string
}): TenantSummary {
  const role =
    row.role === 'admin' || row.role === 'editor' ? row.role : 'editor'
  return { id: row.id, name: row.name, role }
}

export async function createTenant(
  body: CreateTenantBody,
): Promise<TenantSummary> {
  const row = await apiJson<{ id: string; name: string; role: string }>(
    '/tenants',
    {
      body: JSON.stringify(body),
      method: 'POST',
    },
  )
  return normalizeTenant(row)
}

export async function createInvitation(
  tenantId: string,
  body: CreateInvitationBody,
): Promise<CreateInvitationResult> {
  return apiJson<CreateInvitationResult>(`/tenants/${tenantId}/invitations`, {
    body: JSON.stringify(body),
    method: 'POST',
  })
}

export async function previewInvitation(
  token: string,
): Promise<InvitationPreview> {
  return apiJson<InvitationPreview>(
    `/invitations/${encodeURIComponent(token.trim())}/preview`,
  )
}

function normalizeMemberRole(role: string): 'admin' | 'editor' {
  return role === 'admin' || role === 'editor' ? role : 'editor'
}

export async function acceptInvitation(token: string): Promise<void> {
  await apiJson<unknown>(
    `/invitations/${encodeURIComponent(token.trim())}/accept`,
    {
      method: 'POST',
    },
  )
}

export async function listMembers(
  tenantId: string,
  options?: { includePublicKeys?: boolean },
): Promise<Array<TenantMember>> {
  const includePublicKeys = options?.includePublicKeys === true
  const suffix = includePublicKeys ? '?includePublicKeys=true' : ''
  const rows = await apiJson<
    Array<{
      userId: string
      email: string
      publicKey: string
      role: string
      accessValidated?: boolean
      hasOrganizationKeyWrap?: boolean
    }>
  >(`/tenants/${tenantId}/members${suffix}`)
  return rows.map((row) => ({
    userId: row.userId,
    accessValidated: row.accessValidated ?? false,
    email: row.email,
    hasOrganizationKeyWrap: row.hasOrganizationKeyWrap ?? false,
    publicKey: row.publicKey,
    role: normalizeMemberRole(row.role),
  }))
}

export async function patchMemberRole(
  tenantId: string,
  userId: string,
  body: PatchMemberRoleBody,
): Promise<void> {
  await apiJson<unknown>(`/tenants/${tenantId}/members/${userId}/role`, {
    body: JSON.stringify(body),
    method: 'PATCH',
  })
}

export async function removeMember(
  tenantId: string,
  userId: string,
): Promise<void> {
  await apiJson<unknown>(`/tenants/${tenantId}/members/${userId}`, {
    method: 'DELETE',
  })
}
