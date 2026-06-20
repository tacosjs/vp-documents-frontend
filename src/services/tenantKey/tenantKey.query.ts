import { apiJson } from '@/lib/http/apiClient'

import type {
  PostTenantKeyWrappingBody,
  TenantKeyWrappingDto,
} from './tenantKey.type'

export async function fetchTenantKeyWrapping(
  tenantId: string,
): Promise<TenantKeyWrappingDto> {
  return apiJson<TenantKeyWrappingDto>(`/api/tenants/${tenantId}/key-wrapping`)
}

export async function postTenantKeyWrapping(
  tenantId: string,
  body: PostTenantKeyWrappingBody,
): Promise<void> {
  await apiJson<unknown>(`/api/tenants/${tenantId}/key-wrapping`, {
    body: JSON.stringify(body),
    method: 'POST',
  })
}
