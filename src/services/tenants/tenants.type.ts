import type { components } from '@tacosjs/vp-documents-api'

export type TenantSummary = {
  id: string
  name: string
  role: 'admin' | 'editor'
}

export type CreateTenantBody = components['schemas']['CreateTenantRequest']
export type CreateInvitationBody =
  components['schemas']['CreateInvitationRequest']
export type PatchMemberRoleBody =
  components['schemas']['PatchMemberRoleRequest']

export type CreateInvitationResult = {
  expiresAtMs: number
  inviteUrl: string
  token: string
}

export type InvitationPreview = {
  expiresAtMs: number
  role: string
  tenantName: string
}

export type TenantMember = {
  userId: string
  /** False until an admin grants organization access (invite flow). */
  accessValidated: boolean
  email: string
  /** True when the server has a `tenant_key_wrappings` row for this member. */
  hasOrganizationKeyWrap: boolean
  /**
   * OpenPGP public key for organization-key wrapping. Empty unless the list was
   * requested with `includePublicKeys: true` (large payload).
   */
  publicKey: string
  role: 'admin' | 'editor'
}
