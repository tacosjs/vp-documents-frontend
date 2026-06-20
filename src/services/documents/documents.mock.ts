import { faker } from '@faker-js/faker'

import { getMockAuthSession } from '@/services/auth/auth.mock'

import type {
  CreateDocumentInput,
  Document,
  DocumentVersion,
  PatchDocumentInput,
} from './documents.type'

faker.seed(12_345)

const mockStore: Array<Document> = []

const makeDoc = (): Document => {
  const id = faker.string.uuid()
  return {
    id,
    collectionId: null,
    _id: id,
    createdAt: Date.now(),
    encryptedData: `-----BEGIN PGP MESSAGE-----\n${faker.string.alphanumeric(40)}\n-----END PGP MESSAGE-----`,
    okKeyVersion: null,
    ownedByMe: true,
    shared: false,
    updatedAt: Date.now(),
    wrappedItemKey: null,
    wrapScheme: 'self_pgp',
  }
}

export const clearMockDocumentsState = (): void => {
  mockStore.length = 0
}

export const getMockDocumentsList = async (): Promise<Array<Document>> => {
  await new Promise((r) => setTimeout(r, 15))
  if (!getMockAuthSession()) return []
  return [...mockStore].sort((a, b) => b.updatedAt - a.updatedAt)
}

export const getMockDocumentVersions = async (
  _id: string,
): Promise<Array<DocumentVersion>> => {
  await new Promise((r) => setTimeout(r, 12))
  return []
}

export const getMockDocumentById = async (id: string): Promise<Document> => {
  await new Promise((r) => setTimeout(r, 15))
  if (!getMockAuthSession()) {
    throw new Error('Unauthorized')
  }
  const doc = mockStore.find((d) => d.id === id)
  if (!doc) throw new Error('Not found')
  return doc
}

export const replaceMockDocumentCiphertext = (
  id: string,
  encryptedData: string,
): void => {
  const doc = mockStore.find((d) => d.id === id)
  if (doc) {
    doc.encryptedData = encryptedData
    doc.updatedAt = Date.now()
  }
}

export const patchMockDocument = (
  id: string,
  patch: Partial<Document>,
): void => {
  const doc = mockStore.find((d) => d.id === id)
  if (!doc) return
  Object.assign(doc, patch)
  doc.updatedAt = Date.now()
}

export const createMockDocumentMutation = async (
  input: CreateDocumentInput,
): Promise<Document> => {
  await new Promise((r) => setTimeout(r, 25))
  if (!getMockAuthSession()) {
    throw new Error('Unauthorized')
  }
  const id = faker.string.uuid()
  const doc: Document = {
    id,
    collectionId: input.collectionId ?? null,
    _id: id,
    createdAt: Date.now(),
    encryptedData: input.encryptedData,
    okKeyVersion: input.okKeyVersion ?? null,
    ownedByMe: true,
    shared: input.shared ?? false,
    updatedAt: Date.now(),
    wrappedItemKey: input.wrappedItemKey ?? null,
    wrapScheme: input.wrapScheme,
  }
  mockStore.push(doc)
  return doc
}

export const updateMockDocumentMutation = async (
  id: string,
  input: PatchDocumentInput,
): Promise<Document> => {
  await new Promise((r) => setTimeout(r, 20))
  if (!getMockAuthSession()) {
    throw new Error('Unauthorized')
  }
  const doc = mockStore.find((d) => d.id === id)
  if (!doc) throw new Error('Not found')
  if (input.encryptedData !== undefined) doc.encryptedData = input.encryptedData
  if (input.shared !== undefined) doc.shared = input.shared
  if (input.wrappedItemKey !== undefined)
    doc.wrappedItemKey = input.wrappedItemKey
  if (input.collectionId !== undefined) doc.collectionId = input.collectionId
  if (input.okKeyVersion !== undefined) doc.okKeyVersion = input.okKeyVersion
  if (input.wrapScheme !== undefined) doc.wrapScheme = input.wrapScheme
  doc.updatedAt = Date.now()
  return doc
}

/** Seed mock list for tests / demos (optional). */
export const seedMockDocuments = (count = 2): void => {
  clearMockDocumentsState()
  for (let i = 0; i < count; i++) mockStore.push(makeDoc())
}
