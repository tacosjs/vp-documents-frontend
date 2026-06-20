/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'

import { listMembers } from './tenants.query'

vi.mock('@/lib/http/apiClient', () => ({
  apiJson: vi.fn(),
}))

describe('listMembers', () => {
  it('requests includePublicKeys=true only when option is true', async () => {
    const { apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockResolvedValueOnce([
      {
        userId: 'u1',
        accessValidated: true,
        email: 'a@b.co',
        hasOrganizationKeyWrap: true,
        publicKey: 'pk',
        role: 'admin',
      },
    ])

    const rows = await listMembers('tenant-1', { includePublicKeys: true })
    expect(rows[0]?.hasOrganizationKeyWrap).toBe(true)

    expect(apiJson).toHaveBeenCalledWith(
      '/api/tenants/tenant-1/members?includePublicKeys=true',
    )
  })

  it('omits query string when includePublicKeys is false or omitted', async () => {
    const { apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockResolvedValueOnce([])

    await listMembers('tenant-2')

    expect(apiJson).toHaveBeenCalledWith('/api/tenants/tenant-2/members')

    vi.mocked(apiJson).mockResolvedValueOnce([])
    await listMembers('tenant-3', { includePublicKeys: false })

    expect(apiJson).toHaveBeenCalledWith('/api/tenants/tenant-3/members')
  })
})
