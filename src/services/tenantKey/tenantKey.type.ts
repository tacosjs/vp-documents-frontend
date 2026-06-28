import type { components } from '@tacosjs/vp-documents-api'

export type TenantKeyWrappingDto = {
  okKeyVersion: number
  wrappedTenantKey: string
}

export type PostTenantKeyWrappingBody =
  components['schemas']['UpsertTenantKeyWrappingRequest']
