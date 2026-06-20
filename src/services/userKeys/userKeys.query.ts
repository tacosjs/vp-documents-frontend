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
  return apiJson<UserKeys>('/api/me/keys')
}

export const fetchKeyHistory = async (): Promise<KeyHistoryResponse> => {
  if (isMockKeysEnv) return getMockKeyHistory()
  return apiJson<KeyHistoryResponse>('/api/me/keys/history')
}

export const fetchSecurityActivity =
  async (): Promise<SecurityActivityResponse> => {
    if (isMockKeysEnv) return getMockSecurityActivity()
    return apiJson<SecurityActivityResponse>('/api/me/security-activity')
  }

/** Browser download of `GET /api/me/keys/history` payload as JSON. */
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

export const putUserKeys = async (keys: UserKeys): Promise<void> => {
  if (isMockKeysEnv) {
    await updateMockUserKeys(keys)
    return
  }
  await apiJson<{ status: string }>('/api/me/keys', {
    body: JSON.stringify(keys),
    method: 'PUT',
  })
}

export const rotateKeys = async (payload: RotateKeysPayload): Promise<void> => {
  if (isMockKeysEnv) {
    await rotateMockKeys(payload)
    return
  }
  await apiJson<{ status: string }>('/api/me/keys/rotate', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}
