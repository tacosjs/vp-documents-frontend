export type TenantSummary = {
  id: string
  name: string
  role: 'admin' | 'editor'
}

export type CreateTenantBody = {
  name: string
}

export type CreateInvitationBody = {
  expiresInSeconds?: number
  role?: 'admin' | 'editor'
}

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

export type PatchMemberRoleBody = {
  role: 'admin' | 'editor'
}
