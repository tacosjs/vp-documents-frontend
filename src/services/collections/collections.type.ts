export type CollectionDto = {
  id: string
  createdByUserId: string
  tenantId: string
  createdAtMs: number
  name: string
  okKeyVersion: number
  wrappedCollectionKey: string
}

export type OrganizationKeyRotatePayload = {
  collectionRewraps: Array<{
    collectionId: string
    okKeyVersion: number
    wrappedCollectionKey: string
  }>
  itemKeyRewraps: Array<{
    documentId: string
    wrappedItemKey: string
    okKeyVersion?: number
  }>
  okKeyVersion: number
  wrappings: Array<{
    userId: string
    wrappedTenantKey: string
  }>
}
