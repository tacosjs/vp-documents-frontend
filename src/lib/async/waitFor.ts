/**
 * Wait for a value to be non-null/non-undefined
 * Useful for waiting for async state updates
 */

export type WaitForOptions = {
  pollInterval?: number
  timeout?: number
  onRetry?: (attempt: number) => void
}

export async function waitForValue<T>(
  getValue: () => T | null | undefined,
  options: WaitForOptions = {},
): Promise<T> {
  const { onRetry, pollInterval = 100, timeout = 10000 } = options

  const startTime = Date.now()
  let attempt = 0

  for (;;) {
    attempt++

    const value = getValue()
    if (value != null) {
      return value
    }

    if (Date.now() - startTime >= timeout) {
      throw new Error(`Timeout waiting for value after ${timeout}ms`)
    }

    onRetry?.(attempt)

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }
}
