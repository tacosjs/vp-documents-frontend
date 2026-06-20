import { apiJson } from '@/lib/http/apiClient'

import type {
  CreateDocumentInput,
  Document,
  DocumentVersion,
  PatchDocumentInput,
} from './documents.type'

export async function listDocuments(): Promise<Array<Document>> {
  return apiJson<Array<Document>>('/api/documents')
}

export async function getDocument(id: string): Promise<Document> {
  return apiJson<Document>(`/api/documents/${id}`)
}

export async function listDocumentVersions(
  id: string,
): Promise<Array<DocumentVersion>> {
  return apiJson<Array<DocumentVersion>>(`/api/documents/${id}/versions`)
}

export async function createDocument(
  input: CreateDocumentInput,
): Promise<Document> {
  const body: Record<string, unknown> = {
    encryptedData: input.encryptedData,
    wrapScheme: input.wrapScheme,
  }
  if (input.shared !== undefined) {
    body.shared = input.shared
  }
  if (input.wrappedItemKey !== undefined) {
    body.wrappedItemKey = input.wrappedItemKey
  }
  if (input.collectionId !== undefined) {
    body.collectionId = input.collectionId
  }
  if (input.okKeyVersion !== undefined) {
    body.okKeyVersion = input.okKeyVersion
  }
  if (input.encryptedHistoryPayload !== undefined) {
    body.encryptedHistoryPayload = input.encryptedHistoryPayload
  }
  return apiJson<Document>('/api/documents', {
    body: JSON.stringify(body),
    method: 'POST',
  })
}

export async function updateDocument(
  id: string,
  input: PatchDocumentInput,
): Promise<Document> {
  const body: Record<string, unknown> = {}
  if (input.encryptedData !== undefined) {
    body.encryptedData = input.encryptedData
  }
  if (input.shared !== undefined) {
    body.shared = input.shared
  }
  if (input.wrapScheme !== undefined) {
    body.wrapScheme = input.wrapScheme
  }
  if (input.wrappedItemKey !== undefined) {
    body.wrappedItemKey = input.wrappedItemKey
  }
  if (input.collectionId !== undefined) {
    body.collectionId = input.collectionId
  }
  if (input.okKeyVersion !== undefined) {
    body.okKeyVersion = input.okKeyVersion
  }
  if (input.encryptedHistoryPayload !== undefined) {
    body.encryptedHistoryPayload = input.encryptedHistoryPayload
  }
  return apiJson<Document>(`/api/documents/${id}`, {
    body: JSON.stringify(body),
    method: 'PATCH',
  })
}

export const useDocumentsQuery = () => ({
  getById: getDocument,
  create: createDocument,
  list: listDocuments,
  listVersions: listDocumentVersions,
  update: updateDocument,
})
