/**
 * Browser-only UX helper: wrap the data passphrase with a random per-origin device key
 * so refresh / new tabs can restore it without re-entering the login password.
 *
 * Security model:
 * - Server still only sees OpenPGP(password) ciphertext (zero-knowledge for plaintext).
 * - This layer stores AES-GCM(deviceKey, mnemonic) in localStorage; deviceKey is random per browser profile.
 * - XSS on your origin can still exfiltrate wrapped blob + deviceKey → same practical risk as storing secrets in localStorage.
 */

const LS_DEVICE_KEY = 'e2ee_device_wrap_key_v1'
const LS_WRAPPED = 'e2ee_wrapped_data_passphrase_v1'
const WRAP_VERSION = 1

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toB64(u8: Uint8Array): string {
  let s = ''
  for (const b of u8) s += String.fromCharCode(b)
  return btoa(s)
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Copy into a standalone `ArrayBuffer` — `SubtleCrypto` typings require that, not `ArrayBufferLike`. */
function toCryptoBufferSource(data: Uint8Array): ArrayBuffer {
  return new Uint8Array(data).buffer
}

function getOrCreateDeviceRawKey(): Uint8Array {
  const existing = localStorage.getItem(LS_DEVICE_KEY)
  if (existing) return fromB64(existing)
  const raw = crypto.getRandomValues(new Uint8Array(32))
  localStorage.setItem(LS_DEVICE_KEY, toB64(raw))
  return raw
}

async function importWrapKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toCryptoBufferSource(raw),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  )
}

export function clearDeviceWrappedPassphrase(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(LS_DEVICE_KEY)
  localStorage.removeItem(LS_WRAPPED)
}

/** Logout: drop wrapped passphrase; keep device key so the same browser can re-wrap after next login. */
export function clearDeviceWrapOnLogout(): void {
  clearDeviceWrappedPassphrase()
}

export async function persistDeviceWrappedPassphrase(
  plaintextPassphrase: string,
): Promise<void> {
  if (typeof window === 'undefined') return

  const raw = getOrCreateDeviceRawKey()
  const key = await importWrapKey(raw)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { iv: toCryptoBufferSource(iv), name: 'AES-GCM' },
      key,
      toCryptoBufferSource(encoder.encode(plaintextPassphrase)),
    ),
  )

  const payload = {
    ct: toB64(ct),
    iv: toB64(iv),
    v: WRAP_VERSION,
  }
  localStorage.setItem(LS_WRAPPED, JSON.stringify(payload))
}

export async function tryRestoreDeviceWrappedPassphrase(): Promise<
  string | null
> {
  if (typeof window === 'undefined') return null

  const rawJson = localStorage.getItem(LS_WRAPPED)
  if (!rawJson) return null

  let parsed: { ct: string; iv: string; v: number }
  try {
    parsed = JSON.parse(rawJson) as { ct: string; iv: string; v: number }
  } catch {
    clearDeviceWrappedPassphrase()
    return null
  }

  if (parsed.v !== WRAP_VERSION || !parsed.ct || !parsed.iv) {
    clearDeviceWrappedPassphrase()
    return null
  }

  try {
    const raw = getOrCreateDeviceRawKey()
    const key = await importWrapKey(raw)
    const iv = fromB64(parsed.iv)
    const ct = fromB64(parsed.ct)
    const pt = await crypto.subtle.decrypt(
      { iv: toCryptoBufferSource(iv), name: 'AES-GCM' },
      key,
      toCryptoBufferSource(ct),
    )
    return decoder.decode(pt)
  } catch {
    clearDeviceWrappedPassphrase()
    return null
  }
}
