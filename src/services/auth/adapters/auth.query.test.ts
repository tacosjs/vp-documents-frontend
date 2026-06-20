/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'

import { fetchMe, patchMe } from './auth.query'

vi.mock('@/lib/http/apiClient', () => ({
  apiJson: vi.fn(),
}))

describe('patchMe', () => {
  it('includes preferred_locale in PATCH body', async () => {
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

    const me = await patchMe({ preferred_locale: 'fr' })

    expect(me.preferredLocale).toBe('fr')
    expect(apiJson).toHaveBeenCalledWith('/api/me', {
      body: JSON.stringify({ preferred_locale: 'fr' }),
      method: 'PATCH',
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
