/** Same-origin relative path only; blocks protocol-relative and absolute URLs. */
export const isSafeAppRedirectPath = (redirect: string): boolean => {
  if (!redirect.startsWith('/')) return false
  if (redirect.startsWith('//')) return false
  if (redirect.includes('://')) return false
  return true
}

/**
 * Wraps an async form submit with loading state and error handling.
 * Resets error, sets loading, runs fn, catches and sets error, always clears loading.
 */
export type WithFormSubmitCallbacks = {
  fallbackMessage: string
  setError: (err: string | null) => void
  setIsLoading: (loading: boolean) => void
}

export const withFormSubmit = async <T>(
  fn: () => Promise<T>,
  callbacks: WithFormSubmitCallbacks,
): Promise<T | void> => {
  callbacks.setError(null)
  callbacks.setIsLoading(true)
  try {
    return await fn()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : callbacks.fallbackMessage
    callbacks.setError(message)
    return undefined
  } finally {
    callbacks.setIsLoading(false)
  }
}
