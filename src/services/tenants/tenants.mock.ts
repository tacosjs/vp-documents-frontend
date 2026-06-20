import type { InvitationPreview, TenantMember } from './tenants.type'

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

export async function getMockInvitationPreview(
  _token: string,
): Promise<InvitationPreview> {
  await delay(25)
  return {
    expiresAtMs: Date.now() + 7 * 24 * 3600_000,
    role: 'editor',
    tenantName: 'Mock workspace',
  }
}

export async function getMockTenantMembers(): Promise<Array<TenantMember>> {
  await delay(25)
  return []
}
