/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'

import {
  applyAccountPasswordChange,
  initiatePasswordChange,
} from './auth.password.query'

vi.mock('@/lib/http/apiClient', () => ({
  apiJson: vi.fn(),
  ApiHttpError: class ApiHttpError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'ApiHttpError'
      this.status = status
    }
  },
}))

describe('initiatePasswordChange', () => {
  it('calls POST /me/password/change', async () => {
    const { apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockResolvedValue(null)

    await initiatePasswordChange()

    expect(apiJson).toHaveBeenCalledWith('/me/password/change', {
      method: 'POST',
    })
  })
})

describe('applyAccountPasswordChange', () => {
  it('calls POST /me/password/apply with camelCase body', async () => {
    const { apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockResolvedValue(null)

    const payload = {
      encryptedPassphrase: 'enc',
      newSalt: 'abc',
      newVerifier: 'def',
      passwordChangeToken: 'tok',
    }
    await applyAccountPasswordChange(payload)

    expect(apiJson).toHaveBeenCalledWith(
      '/me/password/apply',
      expect.objectContaining({ method: 'POST' }),
    )
    const call = vi
      .mocked(apiJson)
      .mock.calls.find((c) => c[0] === '/me/password/apply')
    const body = JSON.parse((call![1] as { body: string }).body)
    expect(body.passwordChangeToken).toBe('tok')
    expect(body.newSalt).toBe('abc')
    expect(body.newVerifier).toBe('def')
    expect(body.encryptedPassphrase).toBe('enc')
  })
})
