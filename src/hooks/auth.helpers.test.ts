import { describe, expect, it, vi } from 'vitest'

import { withFormSubmit } from './auth.helpers'

describe('withFormSubmit', () => {
  it('runs fn and clears loading', async () => {
    const setError = vi.fn()
    const setIsLoading = vi.fn()
    const result = await withFormSubmit(() => Promise.resolve('ok'), {
      fallbackMessage: 'fail',
      setError,
      setIsLoading,
    })
    expect(result).toBe('ok')
    expect(setIsLoading).toHaveBeenCalledWith(true)
    expect(setIsLoading).toHaveBeenCalledWith(false)
  })

  it('sets error on failure', async () => {
    const setError = vi.fn()
    const setIsLoading = vi.fn()
    await withFormSubmit(() => Promise.reject(new Error('boom')), {
      fallbackMessage: 'fail',
      setError,
      setIsLoading,
    })
    expect(setError).toHaveBeenCalledWith('boom')
  })
})
