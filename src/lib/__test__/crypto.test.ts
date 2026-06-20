/**
 * @vitest-environment node
 * OpenPGP has Uint8Array/instanceof issues in jsdom - run in Node
 */
import { describe, expect, it } from 'vitest'

import {
  createPassphrase,
  decryptPassphrase,
  decryptWithPrivateKey,
  encryptPassphrase,
  encryptWithPublicKey,
  generateKeyPair,
  generateTenantSymmetricKey,
  unwrapRawKeyWithAes256Gcm,
  wrapRawKeyWithAes256Gcm,
} from '@/lib/crypto'

describe('Crypto', () => {
  describe('createPassphrase', () => {
    it('returns a 12-word BIP39 mnemonic phrase', () => {
      const passphrase = createPassphrase()
      const words = passphrase.trim().split(/\s+/)
      expect(words).toHaveLength(12)
      expect(passphrase).toMatch(/^[a-z]+(\s+[a-z]+){11}$/)
    })

    it('returns different passphrases on each call', () => {
      const p1 = createPassphrase()
      const p2 = createPassphrase()
      expect(p1).not.toBe(p2)
    })
  })

  describe('encryptPassphrase / decryptPassphrase', () => {
    it('round-trips passphrase with correct password', async () => {
      const passphrase = createPassphrase()
      const password = 'mySecurePassword123'

      const encrypted = await encryptPassphrase(passphrase, password)
      expect(encrypted).toBeTruthy()
      expect(encrypted).toContain('-----BEGIN PGP MESSAGE-----')

      const decrypted = await decryptPassphrase(encrypted, password)
      expect(decrypted).toBe(passphrase)
    })

    it('throws when decrypting with wrong password', async () => {
      const passphrase = 'test passphrase'
      const encrypted = await encryptPassphrase(passphrase, 'correct')

      await expect(decryptPassphrase(encrypted, 'wrong')).rejects.toThrow()
    })

    it('handles empty passphrase', async () => {
      const encrypted = await encryptPassphrase('', 'password')
      expect(encrypted).toBeTruthy()
      const decrypted = await decryptPassphrase(encrypted, 'password')
      expect(decrypted).toBe('')
    })
  })

  describe('generateKeyPair', () => {
    it('returns armored PGP key pair for email and passphrase', async () => {
      const { privateKey, publicKey } = await generateKeyPair(
        'test@example.com',
        'my passphrase',
      )

      expect(privateKey).toContain('-----BEGIN PGP PRIVATE KEY')
      expect(publicKey).toContain('-----BEGIN PGP PUBLIC KEY')
    })
  })

  describe('encryptWithPublicKey / decryptWithPrivateKey', () => {
    it('round-trips data with a key pair', async () => {
      const { privateKey, publicKey } = await generateKeyPair(
        'encrypt-test@example.com',
        'passphrase123',
      )

      const plaintext = 'Secret message to encrypt'
      const encrypted = await encryptWithPublicKey(plaintext, publicKey)
      expect(encrypted).toContain('-----BEGIN PGP MESSAGE-----')

      const decrypted = await decryptWithPrivateKey(
        encrypted,
        privateKey,
        'passphrase123',
      )
      expect(decrypted).toBe(plaintext)
    })

    it('throws when decrypting with wrong passphrase', async () => {
      const { privateKey, publicKey } = await generateKeyPair(
        'wrong-pass@example.com',
        'correct',
      )
      const encrypted = await encryptWithPublicKey('data', publicKey)

      await expect(
        decryptWithPrivateKey(encrypted, privateKey, 'wrong'),
      ).rejects.toThrow()
    })
  })

  describe('AES-GCM raw key wrap (organization / collection / item keys)', () => {
    it('round-trips a 32-byte key under a random KEK', async () => {
      const kek = generateTenantSymmetricKey()
      const material = generateTenantSymmetricKey()
      const env = await wrapRawKeyWithAes256Gcm(material, kek)
      const back = await unwrapRawKeyWithAes256Gcm(env, kek)
      expect(back).toEqual(material)
    })
  })
})
