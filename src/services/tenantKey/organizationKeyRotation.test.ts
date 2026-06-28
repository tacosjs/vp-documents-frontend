/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/crypto', () => ({
  generateTenantSymmetricKey: vi.fn(() => new Uint8Array(32).fill(7)),
  wrapTenantSymmetricKeyForPublicKey: vi.fn().mockResolvedValue('armored'),
  unwrapRawKeyWithAes256Gcm: vi
    .fn()
    .mockResolvedValue(new Uint8Array(32).fill(8)),
  wrapRawKeyWithAes256Gcm: vi
    .fn()
    .mockResolvedValue('{"v":1,"iv":"a","ct":"b"}'),
}))

vi.mock('@/services/tenants', () => ({
  listMembers: vi.fn(),
}))

vi.mock('@/services/collections/collections.query', () => ({
  listCollections: vi.fn(),
  postOrganizationKeyRotate: vi.fn(),
}))

vi.mock('@/services/documents/documents.query', () => ({
  listDocuments: vi.fn(),
}))

describe('performOrganizationKeyRotation', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { listMembers } = await import('@/services/tenants')
    const { listCollections, postOrganizationKeyRotate } =
      await import('@/services/collections/collections.query')
    const { listDocuments } =
      await import('@/services/documents/documents.query')

    vi.mocked(listMembers).mockResolvedValue([
      {
        userId: 'u1',
        accessValidated: true,
        email: 'a@b.co',
        hasOrganizationKeyWrap: true,
        role: 'admin',
        publicKey:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\nx\n-----END PGP PUBLIC KEY BLOCK-----',
      },
    ])
    vi.mocked(listCollections).mockResolvedValue([
      {
        id: 'c1',
        createdByUserId: 'u1',
        tenantId: 't1',
        createdAtMs: 0,
        name: 'Col',
        okKeyVersion: 1,
        wrappedCollectionKey: '{}',
      },
    ])
    vi.mocked(listDocuments).mockResolvedValue([
      {
        id: 'd-org',
        collectionId: null,
        _id: 'd-org',
        createdAt: 0,
        encryptedData: 'enc',
        okKeyVersion: 2,
        ownedByMe: true,
        shared: true,
        updatedAt: 0,
        wrappedItemKey: '{}',
        wrapScheme: 'organization_aes',
      },
      {
        id: 'd-self',
        collectionId: null,
        _id: 'd-self',
        createdAt: 0,
        encryptedData: 'enc',
        okKeyVersion: null,
        ownedByMe: true,
        shared: false,
        updatedAt: 0,
        wrappedItemKey: '{}',
        wrapScheme: 'self_pgp',
      },
    ])
    vi.mocked(postOrganizationKeyRotate).mockResolvedValue(undefined)
  })

  it('posts wrappings, collection rewraps, and organization_aes item rewraps', async () => {
    const { postOrganizationKeyRotate } =
      await import('@/services/collections/collections.query')
    const { performOrganizationKeyRotation } =
      await import('./organizationKeyRotation')

    await performOrganizationKeyRotation({
      tenantId: 't1',
      oldTenantSymmetricKey: new Uint8Array(32).fill(1),
      organizationKeyVersion: 3,
    })

    expect(postOrganizationKeyRotate).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        okKeyVersion: 3,
        collectionRewraps: [
          expect.objectContaining({
            collectionId: 'c1',
            okKeyVersion: 3,
          }),
        ],
        itemKeyRewraps: [
          expect.objectContaining({
            documentId: 'd-org',
            okKeyVersion: 3,
          }),
        ],
        wrappings: [
          { userId: 'u1', okKeyVersion: 3, wrappedTenantKey: 'armored' },
        ],
      }),
    )
  })
})
