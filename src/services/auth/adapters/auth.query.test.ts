/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'

import { fetchMe, patchMe } from './auth.query'

vi.mock('@/lib/http/apiClient', () => ({
  apiJson: vi.fn(),
  ApiHttpError: class ApiHttpError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message)
      this.name = 'ApiHttpError'
    }
  },
}))

describe('fetchMe', () => {
  it('returns null on 401', async () => {
    const { ApiHttpError, apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockRejectedValueOnce(
      new ApiHttpError(401, 'Unauthorized'),
    )
    expect(await fetchMe()).toBeNull()
  })

  it('returns null on 403', async () => {
    const { ApiHttpError, apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockRejectedValueOnce(new ApiHttpError(403, 'Forbidden'))
    expect(await fetchMe()).toBeNull()
  })

  it('re-throws on other errors', async () => {
    const { ApiHttpError, apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockRejectedValueOnce(
      new ApiHttpError(500, 'Server Error'),
    )
    await expect(fetchMe()).rejects.toThrow('Server Error')
  })
})

describe('patchMe', () => {
  it('includes preferredLocale in PATCH body', async () => {
    const { apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockResolvedValueOnce({
      display_name: null,
      email: 'a@b.co',
      preferred_locale: 'fr',
      role: null,
      tenant_id: null,
      tenant_name: null,
      user_id: 'u1',
    })

    const me = await patchMe({
      displayName: null,
      email: null,
      preferredLocale: 'fr',
    })

    expect(me.preferredLocale).toBe('fr')
    expect(apiJson).toHaveBeenCalledWith('/me', {
      method: 'PATCH',
      body: JSON.stringify({
        displayName: null,
        email: null,
        preferredLocale: 'fr',
      }),
    })
  })

  it('maps tenant_id / role / tenant_name and normalizes role casing', async () => {
    const { apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockResolvedValueOnce({
      display_name: null,
      email: 'a@b.co',
      preferred_locale: 'en',
      role: 'Admin',
      tenant_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      tenantName: 'Acme',
      user_id: 'u1',
    })

    const me = await fetchMe()

    expect(me?.tenantId).toBe('7c9e6679-7425-40de-944b-e07fc1f90ae7')
    expect(me?.tenantRole).toBe('admin')
    expect(me?.tenantName).toBe('Acme')
  })
})
