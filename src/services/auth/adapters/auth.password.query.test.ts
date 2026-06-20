/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'

import { createPassphrase, encryptPassphrase } from '@/lib/crypto'
import { InvalidAccountPasswordError } from '@/services/userKeys/keyRotation'

import { changeAccountPassword } from './auth.password.query'
import { completeMePasswordSrp } from './auth.srp'

vi.mock('./auth.srp', () => ({
  completeMePasswordSrp: vi.fn(),
}))

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

describe('changeAccountPassword', () => {
  it('throws InvalidAccountPasswordError when old password cannot decrypt blob', async () => {
    const passphrase = createPassphrase()
    const encryptedPassphrase = await encryptPassphrase(
      passphrase,
      'correct-account-password',
    )

    await expect(
      changeAccountPassword({
        dataPassphrase: passphrase,
        email: 'user@example.com',
        encryptedPassphrase,
        newPassword: 'new-password-9X!',
        oldPassword: 'wrong-account-password',
      }),
    ).rejects.toBeInstanceOf(InvalidAccountPasswordError)

    expect(completeMePasswordSrp).not.toHaveBeenCalled()
  })

  it('throws InvalidAccountPasswordError when decrypted blob does not match data passphrase', async () => {
    const realPassphrase = createPassphrase()
    const otherPassphrase = createPassphrase()
    const encryptedPassphrase = await encryptPassphrase(
      realPassphrase,
      'same-password',
    )

    await expect(
      changeAccountPassword({
        dataPassphrase: otherPassphrase,
        email: 'user@example.com',
        encryptedPassphrase,
        newPassword: 'new-password-9X!',
        oldPassword: 'same-password',
      }),
    ).rejects.toBeInstanceOf(InvalidAccountPasswordError)

    expect(completeMePasswordSrp).not.toHaveBeenCalled()
  })

  it('maps 401 from SRP step to InvalidAccountPasswordError', async () => {
    const { ApiHttpError, apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(completeMePasswordSrp).mockRejectedValue(
      new ApiHttpError(401, 'nope'),
    )

    const passphrase = createPassphrase()
    const encryptedPassphrase = await encryptPassphrase(
      passphrase,
      'account-password',
    )

    await expect(
      changeAccountPassword({
        dataPassphrase: passphrase,
        email: 'user@example.com',
        encryptedPassphrase,
        newPassword: 'another-password-9X!',
        oldPassword: 'account-password',
      }),
    ).rejects.toBeInstanceOf(InvalidAccountPasswordError)

    const { apiJson: apiJsonAfter } = await import('@/lib/http/apiClient')
    expect(apiJsonAfter).not.toHaveBeenCalled()
  })

  it('calls apply endpoint after successful SRP', async () => {
    vi.mocked(completeMePasswordSrp).mockResolvedValue('deadbeef'.repeat(8))

    const { apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockResolvedValue({ status: 'updated' })

    const passphrase = createPassphrase()
    const encryptedPassphrase = await encryptPassphrase(
      passphrase,
      'account-password',
    )

    await changeAccountPassword({
      dataPassphrase: passphrase,
      email: 'user@example.com',
      encryptedPassphrase,
      newPassword: 'next-password-9X!',
      oldPassword: 'account-password',
    })

    expect(completeMePasswordSrp).toHaveBeenCalledWith(
      'user@example.com',
      'account-password',
    )
    expect(apiJson).toHaveBeenCalledWith(
      '/api/me/password',
      expect.objectContaining({ method: 'POST' }),
    )
    const call = vi
      .mocked(apiJson)
      .mock.calls.find((c) => c[0] === '/api/me/password')
    expect(call).toBeDefined()
    const body = JSON.parse((call![1] as { body: string }).body)
    expect(body.password_change_token).toBe('deadbeef'.repeat(8))
    expect(body.new_salt).toMatch(/^[0-9a-f]+$/i)
    expect(body.new_verifier).toMatch(/^[0-9a-f]{512}$/)
    expect(typeof body.encrypted_passphrase).toBe('string')
  })
})
