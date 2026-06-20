import type { DocumentWrapScheme } from '@/lib/crypto'

/** Document row from documents API (camelCase JSON). */
export type Document = {
  id: string
  collectionId: string | null
  _id: string
  createdAt: number
  encryptedData: string
  okKeyVersion: number | null
  /** True when the current user authored the document (may update ciphertext / shared). */
  ownedByMe: boolean
  /** When true, other members of the organization can access this document. */
  shared: boolean
  updatedAt: number
  /** Present when using per-item keys (`self_pgp`, `organization_aes`, `collection_aes`). */
  wrappedItemKey: string | null
  /** Client encryption scheme; see docs/encryption. */
  wrapScheme: DocumentWrapScheme
}

export type CreateDocumentInput = {
  collectionId?: string
  encryptedData: string
  wrapScheme: DocumentWrapScheme
  encryptedHistoryPayload?: string
  okKeyVersion?: number
  shared?: boolean
  wrappedItemKey?: string
}

export type PatchDocumentInput = {
  collectionId?: string
  encryptedData?: string
  encryptedHistoryPayload?: string
  okKeyVersion?: number
  shared?: boolean
  wrappedItemKey?: string
  wrapScheme?: DocumentWrapScheme
}

export type DocumentVersion = {
  encryptedPayload: string
  version: number
}
