/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'

import {
  createPassphrase,
  encryptDocumentBodyWithItemKey,
  encryptPassphrase,
  generateItemKey,
  generateKeyPair,
  wrapItemKeyWithPublicKey,
} from '@/lib/crypto'

import {
  InvalidAccountPasswordError,
  rotateEncryptionKeys,
} from './keyRotation'

vi.mock('@/services/documents/documents.query', () => ({
  listDocuments: vi.fn(),
}))

vi.mock('@/services/userKeys/userKeys.query', () => ({
  rotateKeys: vi.fn(),
}))

describe('rotateEncryptionKeys', () => {
  it('rejects wrong account password before listing documents', async () => {
    const { listDocuments } =
      await import('@/services/documents/documents.query')
    const currentPassphrase = createPassphrase()
    const encryptedPassphrase = await encryptPassphrase(
      currentPassphrase,
      'correct-account-password',
    )
    const { privateKey, publicKey } = await generateKeyPair(
      'user@example.com',
      currentPassphrase,
    )

    await expect(
      rotateEncryptionKeys({
        tenantId: null,
        userId: null,
        accountEmail: 'user@example.com',
        accountPassword: 'wrong-account-password',
        currentPassphrase,
        currentKeys: {
          encryptedPassphrase,
          encryptedPrivateKey: privateKey,
          publicKey,
        },
      }),
    ).rejects.toBeInstanceOf(InvalidAccountPasswordError)

    expect(listDocuments).not.toHaveBeenCalled()
  })

  it('skips organization_aes documents and re-wraps self_pgp item key', async () => {
    const { listDocuments } =
      await import('@/services/documents/documents.query')
    const { rotateKeys } = await import('@/services/userKeys/userKeys.query')

    const currentPassphrase = createPassphrase()
    const encryptedPassphrase = await encryptPassphrase(
      currentPassphrase,
      'account-pw',
    )
    const { privateKey, publicKey } = await generateKeyPair(
      'user@example.com',
      currentPassphrase,
    )

    const ik = generateItemKey()
    const encryptedData = await encryptDocumentBodyWithItemKey('hello', ik)
    const wrappedItemKey = await wrapItemKeyWithPublicKey(ik, publicKey)

    vi.mocked(listDocuments).mockResolvedValue([
      {
        id: 'skip-org',
        collectionId: null,
        _id: 'skip-org',
        createdAt: 0,
        okKeyVersion: 1,
        ownedByMe: true,
        shared: true,
        updatedAt: 0,
        wrappedItemKey: 'wik',
        wrapScheme: 'organization_aes',
        encryptedData:
          '-----BEGIN PGP MESSAGE-----\nx\n-----END PGP MESSAGE-----',
      },
      {
        id: 'rewrap-self-pgp',
        collectionId: null,
        _id: 'rewrap-self-pgp',
        createdAt: 0,
        encryptedData,
        okKeyVersion: null,
        ownedByMe: true,
        shared: false,
        updatedAt: 0,
        wrappedItemKey,
        wrapScheme: 'self_pgp',
      },
    ])

    await rotateEncryptionKeys({
      tenantId: null,
      userId: null,
      accountEmail: 'user@example.com',
      accountPassword: 'account-pw',
      currentPassphrase,
      currentKeys: {
        encryptedPassphrase,
        encryptedPrivateKey: privateKey,
        publicKey,
      },
    })

    expect(rotateKeys).toHaveBeenCalled()
    const payload = vi.mocked(rotateKeys).mock.calls[0][0]
    expect(payload.documents).toHaveLength(1)
    expect(payload.documents[0].id).toBe('rewrap-self-pgp')
    expect(payload.documents[0].wrappedItemKey).toBeDefined()
  })
})
