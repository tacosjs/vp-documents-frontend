import { apiJson } from '@/lib/http/apiClient'

import type {
  CreateDocumentInput,
  Document,
  DocumentVersion,
  PatchDocumentInput,
} from './documents.type'

export async function listDocuments(): Promise<Array<Document>> {
  return apiJson<Array<Document>>('/documents')
}

export async function getDocument(id: string): Promise<Document> {
  return apiJson<Document>(`/documents/${id}`)
}

export async function listDocumentVersions(
  id: string,
): Promise<Array<DocumentVersion>> {
  return apiJson<Array<DocumentVersion>>(`/documents/${id}/versions`)
}

export async function createDocument(
  input: CreateDocumentInput,
): Promise<Document> {
  return apiJson<Document>('/documents', {
    body: JSON.stringify(input),
    method: 'POST',
  })
}

export async function updateDocument(
  id: string,
  input: PatchDocumentInput,
): Promise<Document> {
  return apiJson<Document>(`/documents/${id}`, {
    body: JSON.stringify(input),
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
