import type { components } from '@tacosjs/vp-documents-api'

export type CollectionDto = {
  id: string
  createdByUserId: string
  tenantId: string
  createdAtMs: number
  name: string
  okKeyVersion: number
  wrappedCollectionKey: string
}

export type OrganizationKeyRotatePayload =
  components['schemas']['ApplyOrgKeyRotationRequest']
