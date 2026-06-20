import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EncryptionSessionProvider } from '@/contexts/EncryptionSessionContext'
import { useSignOut } from '@/services/auth'

vi.mock('@/lib/http/apiClient', () => ({
  apiVoid: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/userKeys/userKeys.mock', () => ({
  clearMockUserKeysState: vi.fn(),
  getMockUserKeys: vi.fn(),
  seedMockUserKeys: vi.fn(),
}))

vi.mock('@/services/documents/documents.mock', () => ({
  clearMockDocumentsState: vi.fn(),
}))

vi.mock('@/lib/crypto', () => ({
  clearDeviceWrapOnLogout: vi.fn(),
  createPassphrase: vi.fn(),
  decryptPassphrase: vi.fn(),
  encryptPassphrase: vi.fn(),
  generateKeyPair: vi.fn(),
}))

const memory = new Map<string, string>()
const mockLocalStorage = {
  length: 0,
  clear: () => {
    memory.clear()
  },
  getItem: (k: string) => memory.get(k) ?? null,
  key: () => null,
  removeItem: (k: string) => {
    memory.delete(k)
  },
  setItem: (k: string, v: string) => {
    memory.set(k, v)
  },
}

beforeEach(() => {
  memory.clear()
  vi.stubGlobal('localStorage', mockLocalStorage)
})

describe('useSignOut', () => {
  it('calls logout endpoint', async () => {
    const { apiVoid } = await import('@/lib/http/apiClient')
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <EncryptionSessionProvider>{children}</EncryptionSessionProvider>
      </QueryClientProvider>
    )
    const { result } = renderHook(() => useSignOut(), { wrapper })
    await act(async () => {
      await result.current.signOut()
    })
    expect(apiVoid).toHaveBeenCalledWith('/auth/logout', { method: 'POST' })
  })
})
