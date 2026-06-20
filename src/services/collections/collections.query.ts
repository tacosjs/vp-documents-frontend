import { apiJson } from '@/lib/http/apiClient'

import type {
  CollectionDto,
  OrganizationKeyRotatePayload,
} from './collections.type'

export async function listCollections(
  tenantId: string,
): Promise<Array<CollectionDto>> {
  return apiJson<Array<CollectionDto>>(`/api/tenants/${tenantId}/collections`)
}

export async function getCollection(
  tenantId: string,
  collectionId: string,
): Promise<CollectionDto> {
  return apiJson<CollectionDto>(
    `/api/tenants/${tenantId}/collections/${collectionId}`,
  )
}

export async function postOrganizationKeyRotate(
  tenantId: string,
  body: OrganizationKeyRotatePayload,
): Promise<void> {
  await apiJson<unknown>(`/api/tenants/${tenantId}/organization-key/rotate`, {
    body: JSON.stringify(body),
    method: 'POST',
  })
}
