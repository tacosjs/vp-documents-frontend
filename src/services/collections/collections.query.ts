import { apiJson } from '@/lib/http/apiClient'

import type {
  CollectionDto,
  OrganizationKeyRotatePayload,
} from './collections.type'

export async function listCollections(): Promise<Array<CollectionDto>> {
  return apiJson<Array<CollectionDto>>('/collections')
}

export async function getCollection(
  collectionId: string,
): Promise<CollectionDto> {
  return apiJson<CollectionDto>(`/collections/${collectionId}`)
}

export async function postOrganizationKeyRotate(
  tenantId: string,
  body: OrganizationKeyRotatePayload,
): Promise<void> {
  await apiJson<unknown>(`/tenants/${tenantId}/key-rotation/apply`, {
    body: JSON.stringify(body),
    method: 'POST',
  })
}
