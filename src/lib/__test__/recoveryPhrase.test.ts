/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'

import {
  hashRecoveryPhraseSha256Hex,
  normalizeRecoveryPhrase,
} from '@/lib/crypto'

describe('normalizeRecoveryPhrase', () => {
  it('matches server word normalization', () => {
    expect(normalizeRecoveryPhrase('  Foo BAR\tbaz  ')).toBe('foo bar baz')
  })
})

describe('hashRecoveryPhraseSha256Hex', () => {
  it('is stable for a given normalized input', async () => {
    const a = await hashRecoveryPhraseSha256Hex('one two THREE')
    const b = await hashRecoveryPhraseSha256Hex('  one two three  ')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })
})
