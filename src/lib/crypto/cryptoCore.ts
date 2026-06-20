import { generateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import * as openpgp from 'openpgp'

import { appOpenPgpEncryptConfig } from './openpgpPolicy'

/**
 * Create a passphrase as a BIP39 mnemonic phrase
 * @returns A 12-word mnemonic phrase (128 bits of entropy)
 */
export const createPassphrase = (): string => {
  return generateMnemonic(wordlist, 128)
}

/**
 * Create a hash of a passphrase
 * @param passphrase The passphrase to encrypt
 * @param password The password to use for encryption
 * @returns An encrypted passphrase
 */
export const encryptPassphrase = async (
  passphrase: string,
  password: string,
): Promise<string> => {
  const message = await openpgp.createMessage({
    text: passphrase,
  })

  const encrypted = await openpgp.encrypt({
    config: appOpenPgpEncryptConfig,
    message,
    passwords: [password],
  })

  return encrypted as string
}

/**
 * Decrypt a passphrase
 * @param encryptedPassphrase The encrypted passphrase to decrypt
 * @param password The password to use for decryption
 * @returns A decrypted passphrase
 */
export const decryptPassphrase = async (
  encryptedPassphrase: string,
  password: string,
): Promise<string> => {
  const message = await openpgp.readMessage({
    armoredMessage: encryptedPassphrase,
  })

  const { data: decrypted } = await openpgp.decrypt({
    message,
    passwords: [password],
  })

  return decrypted as string
}

/**
 * Encrypt data with a public key
 * @param data Plaintext to encrypt
 * @param publicKey Armored public key
 * @returns Armored encrypted message
 */
export const encryptWithPublicKey = async (
  data: string,
  publicKey: string,
): Promise<string> => {
  const message = await openpgp.createMessage({
    text: data,
  })

  const publicKeyObj = await openpgp.readKey({
    armoredKey: publicKey,
  })

  const encrypted = await openpgp.encrypt({
    config: appOpenPgpEncryptConfig,
    encryptionKeys: publicKeyObj,
    message,
  })

  return encrypted as string
}

/**
 * Decrypt data with a private key
 * @param encryptedData Armored encrypted message
 * @param encryptedPrivateKey Armored encrypted private key
 * @param passphrase Passphrase to unlock the private key
 * @returns Decrypted plaintext
 */
export const decryptWithPrivateKey = async (
  encryptedData: string,
  encryptedPrivateKey: string,
  passphrase: string,
): Promise<string> => {
  const message = await openpgp.readMessage({
    armoredMessage: encryptedData,
  })

  const privateKeyObj = await openpgp.decryptKey({
    passphrase,
    privateKey: await openpgp.readPrivateKey({
      armoredKey: encryptedPrivateKey,
    }),
  })

  const { data: decrypted } = await openpgp.decrypt({
    decryptionKeys: privateKeyObj,
    message,
  })

  return decrypted as string
}

/**
 * Generate a PGP key pair for a user
 * @param email User email for key identity
 * @param passphrase Passphrase to protect the private key
 * @returns Armored private and public keys
 */
export const generateKeyPair = async (
  email: string,
  passphrase: string,
): Promise<{ privateKey: string; publicKey: string }> => {
  const { privateKey, publicKey } = await openpgp.generateKey({
    config: appOpenPgpEncryptConfig,
    curve: 'nistP256',
    format: 'armored',
    passphrase,
    type: 'ecc',
    userIDs: [{ email }],
  })

  return { privateKey, publicKey }
}

// --- Tenant symmetric key (TSK) + AES-256-GCM document bodies (shared org docs) ---

const TENANT_KEY_BYTES = 32

const bytesToBase64 = (bytes: Uint8Array): string => {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

const base64ToBytes = (b64: string): Uint8Array => {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Random 256-bit key; never send to the server except as OpenPGP-wrapped ciphertext. */
export const generateTenantSymmetricKey = (): Uint8Array => {
  const k = new Uint8Array(TENANT_KEY_BYTES)
  crypto.getRandomValues(k)
  return k
}

/** Wrap TSK with a member's OpenPGP public key (armored ciphertext stored server-side). */
export const wrapTenantSymmetricKeyForPublicKey = async (
  keyBytes: Uint8Array,
  publicKeyArmored: string,
): Promise<string> => {
  if (keyBytes.length !== TENANT_KEY_BYTES) {
    throw new Error('Invalid tenant key length')
  }
  const b64 = bytesToBase64(keyBytes)
  return encryptWithPublicKey(b64, publicKeyArmored)
}

/** Unwrap TSK after decrypting the armored blob with the user's private key. */
export const unwrapTenantSymmetricKeyFromPgp = async (
  armored: string,
  encryptedPrivateKey: string,
  passphrase: string,
): Promise<Uint8Array> => {
  const b64 = await decryptWithPrivateKey(
    armored,
    encryptedPrivateKey,
    passphrase,
  )
  const raw = base64ToBytes(b64.trim())
  if (raw.length !== TENANT_KEY_BYTES) {
    throw new Error('Invalid tenant key material')
  }
  return raw
}

type TenantDocEnvelopeV1 = {
  ct: string
  iv: string
  v: 1
}

/** Parsed JSON may have any `v`; validate before treating as v1. */
type TenantDocEnvelopeParsed = {
  ct: unknown
  iv: unknown
  v: unknown
}

/** AES-256-GCM; envelope is JSON (opaque to the server). */
export const encryptTextWithTenantSymmetricKey = async (
  plaintext: string,
  rawKey32: Uint8Array,
): Promise<string> => {
  if (rawKey32.length !== TENANT_KEY_BYTES) {
    throw new Error('Invalid tenant key length')
  }
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey32,
    { length: 256, name: 'AES-GCM' },
    false,
    ['encrypt'],
  )
  const enc = new TextEncoder()
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { iv, name: 'AES-GCM', tagLength: 128 },
      cryptoKey,
      enc.encode(plaintext),
    ),
  )
  const envelope: TenantDocEnvelopeV1 = {
    ct: bytesToBase64(ct),
    iv: bytesToBase64(iv),
    v: 1,
  }
  return JSON.stringify(envelope)
}

export const decryptTextWithTenantSymmetricKey = async (
  envelopeJson: string,
  rawKey32: Uint8Array,
): Promise<string> => {
  if (rawKey32.length !== TENANT_KEY_BYTES) {
    throw new Error('Invalid tenant key length')
  }
  const parsed = JSON.parse(envelopeJson) as TenantDocEnvelopeParsed
  if (
    parsed.v !== 1 ||
    typeof parsed.iv !== 'string' ||
    typeof parsed.ct !== 'string'
  ) {
    throw new Error('Unsupported document ciphertext')
  }
  const iv = base64ToBytes(parsed.iv)
  const ct = base64ToBytes(parsed.ct)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey32,
    { length: 256, name: 'AES-GCM' },
    false,
    ['decrypt'],
  )
  const pt = await crypto.subtle.decrypt(
    { iv, name: 'AES-GCM', tagLength: 128 },
    cryptoKey,
    ct,
  )
  return new TextDecoder().decode(pt)
}

// --- Item / collection keys: AES-256-GCM wrap of raw 32-byte keys (KEK = org or collection key) ---

type RawKeyWrapEnvelopeV1 = { ct: string; iv: string; v: 1 }

/** Wrap a 32-byte key with another 32-byte AES key (JSON envelope, opaque to server). */
export const wrapRawKeyWithAes256Gcm = async (
  keyToWrap32: Uint8Array,
  kek32: Uint8Array,
): Promise<string> => {
  if (
    keyToWrap32.length !== TENANT_KEY_BYTES ||
    kek32.length !== TENANT_KEY_BYTES
  ) {
    throw new Error('Invalid key length')
  }
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    kek32,
    { length: 256, name: 'AES-GCM' },
    false,
    ['encrypt'],
  )
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { iv, name: 'AES-GCM', tagLength: 128 },
      cryptoKey,
      keyToWrap32,
    ),
  )
  const env: RawKeyWrapEnvelopeV1 = {
    ct: bytesToBase64(ct),
    iv: bytesToBase64(iv),
    v: 1,
  }
  return JSON.stringify(env)
}

export const unwrapRawKeyWithAes256Gcm = async (
  envelopeJson: string,
  kek32: Uint8Array,
): Promise<Uint8Array> => {
  if (kek32.length !== TENANT_KEY_BYTES) {
    throw new Error('Invalid KEK length')
  }
  const parsed = JSON.parse(envelopeJson) as {
    ct?: unknown
    iv?: unknown
    v?: unknown
  }
  if (
    parsed.v !== 1 ||
    typeof parsed.iv !== 'string' ||
    typeof parsed.ct !== 'string'
  ) {
    throw new Error('Unsupported key wrap envelope')
  }
  const iv = base64ToBytes(parsed.iv)
  const ct = base64ToBytes(parsed.ct)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    kek32,
    { length: 256, name: 'AES-GCM' },
    false,
    ['decrypt'],
  )
  const pt = new Uint8Array(
    await crypto.subtle.decrypt(
      { iv, name: 'AES-GCM', tagLength: 128 },
      cryptoKey,
      ct,
    ),
  )
  if (pt.length !== TENANT_KEY_BYTES) {
    throw new Error('Invalid unwrapped key material')
  }
  return pt
}

/** Random 32-byte item (cipher) key. */
export const generateItemKey = (): Uint8Array => generateTenantSymmetricKey()

/** Wrap item key with user's OpenPGP public key (armored ciphertext). */
export const wrapItemKeyWithPublicKey = wrapTenantSymmetricKeyForPublicKey

/** Unwrap item key from OpenPGP armored ciphertext. */
export const unwrapItemKeyFromPgp = unwrapTenantSymmetricKeyFromPgp

/** Document body encryption uses the AES-GCM JSON envelope (same as tenant symmetric key bodies). */
export const encryptDocumentBodyWithItemKey = encryptTextWithTenantSymmetricKey

export const decryptDocumentBodyWithItemKey = decryptTextWithTenantSymmetricKey

export type DocumentWrapScheme =
  | 'self_pgp'
  | 'organization_aes'
  | 'collection_aes'
