/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'

import { createPassphrase, encryptPassphrase } from '@/lib/crypto'

import {
  completeAccountPasswordRecovery,
  verifyAccountRecovery,
} from './auth.recovery.query'

vi.mock('./srpRustLogin', () => ({
  deriveSrpPrivateKey: vi.fn().mockResolvedValue(new Uint8Array(32)),
  deriveSrpVerifier: vi.fn().mockReturnValue('cd'.repeat(256)),
  generateSrpRegistrationSalt: vi.fn().mockReturnValue('ab'.repeat(16)),
}))

vi.mock('@/lib/http/apiClient', () => ({
  apiJson: vi.fn(),
}))

describe('verifyAccountRecovery', () => {
  it('POSTs email and recovery phrase as camelCase JSON', async () => {
    const { apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockResolvedValueOnce({ recoveryToken: 'tok' })

    const out = await verifyAccountRecovery({
      email: '  User@Example.COM ',
      recoveryPhrase: 'one two three',
    })

    expect(out.recoveryToken).toBe('tok')
    expect(apiJson).toHaveBeenCalledWith('/auth/recovery/verify', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        recoveryPhrase: 'one two three',
      }),
    })
  })
})

describe('completeAccountPasswordRecovery', () => {
  it('POSTs recovery payload with camelCase fields', async () => {
    const { apiJson } = await import('@/lib/http/apiClient')
    vi.mocked(apiJson).mockResolvedValueOnce({ status: 'updated' })

    const passphrase = createPassphrase()
    const enc = await encryptPassphrase(passphrase, 'new-account-pw-9')

    await completeAccountPasswordRecovery({
      dataPassphrase: passphrase,
      email: 'user@example.com',
      newPassword: 'new-account-pw-9',
      recoveryToken: 'deadbeef'.repeat(8),
    })

    const call = vi
      .mocked(apiJson)
      .mock.calls.find((c) => c[0] === '/auth/recovery/complete')
    expect(call).toBeDefined()
    const body = JSON.parse((call![1] as { body: string }).body)
    expect(body.recoveryToken).toBe('deadbeef'.repeat(8))
    expect(body.newSalt).toBe('ab'.repeat(16))
    expect(body.newVerifier).toBe('cd'.repeat(256))
    expect(typeof body.encryptedPassphrase).toBe('string')
    expect(body.encryptedPassphrase.length).toBeGreaterThan(0)
  })
})
