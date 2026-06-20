import { describe, expect, it, vi } from 'vitest'

import { waitForValue } from '@/lib/async/waitFor'

describe('waitForValue', () => {
  it('returns value immediately when available', async () => {
    const getValue = vi.fn().mockReturnValue('ready')
    const result = await waitForValue(getValue)
    expect(result).toBe('ready')
    expect(getValue).toHaveBeenCalledTimes(1)
  })

  it('polls until value is available', async () => {
    const getValue = vi
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(42)
    const result = await waitForValue(getValue, { pollInterval: 5 })
    expect(result).toBe(42)
    expect(getValue).toHaveBeenCalledTimes(3)
  })

  it('calls onRetry callback on each poll', async () => {
    const onRetry = vi.fn()
    const getValue = vi
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce('done')
    await waitForValue(getValue, { onRetry, pollInterval: 5 })
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('throws after timeout when value never appears', async () => {
    const getValue = vi.fn().mockReturnValue(undefined)
    await expect(
      waitForValue(getValue, { pollInterval: 10, timeout: 50 }),
    ).rejects.toThrow(/Timeout waiting for value/)
  })
})
