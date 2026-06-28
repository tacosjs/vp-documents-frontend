import { env } from '@/env'
import { apiJson } from '@/lib/http/apiClient'

import {
  getMockKeyHistory,
  getMockSecurityActivity,
  rotateMockKeys,
  updateMockUserKeys,
} from './userKeys.mock'
import type {
  KeyHistoryResponse,
  RotateKeysPayload,
  SecurityActivityResponse,
  UserKeys,
} from './userKeys.type'

const isMockKeysEnv = env.VITE_MOCK_USER_KEYS === true

export const fetchUserKeys = async (): Promise<UserKeys> => {
  return apiJson<UserKeys>('/me/keys')
}

export const fetchKeyHistory = async (): Promise<KeyHistoryResponse> => {
  if (isMockKeysEnv) return getMockKeyHistory()
  return apiJson<KeyHistoryResponse>('/me/keys/history')
}

export const fetchSecurityActivity =
  async (): Promise<SecurityActivityResponse> => {
    if (isMockKeysEnv) return getMockSecurityActivity()
    return apiJson<SecurityActivityResponse>('/me/security-activity')
  }

/** Browser download of `GET /me/keys/history` payload as JSON. */
export const downloadKeyHistoryJson = (data: KeyHistoryResponse): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'public-key-history.json'
  a.click()
  URL.revokeObjectURL(url)
}

export const downloadSecurityActivityJson = (
  data: SecurityActivityResponse,
): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'security-activity.json'
  a.click()
  URL.revokeObjectURL(url)
}

export const rotateKeys = async (payload: RotateKeysPayload): Promise<void> => {
  if (isMockKeysEnv) {
    await rotateMockKeys(payload)
    return
  }
  await apiJson<{ status: string }>('/me/keys/rotate', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}
