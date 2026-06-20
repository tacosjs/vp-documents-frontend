/**
 * SRP-6a compatible with the Rust `srp` crate (SHA-256, G_2048): registration (`x`, `v`)
 * and the login handshake (unpadded `u`, M1/M2 matching `srp::utils`).
 *
 * Off-the-shelf JS SRP packages typically implement RFC 5054 padding and proofs; they do
 * not interoperate with this server for login. Registration math is small, so it lives here
 * instead of a `file:` dependency.
 */

const SRP_2048_N_HEX =
  'ac6bdb41324a9a9bf166de5e1389582faf72b6651987ee07fc3192943db56050a37329cbb4a099ed8193e0757767a13dd52312ab4b03310dcd7f48a9da04fd50e8083969edb767b0cf6095179a163ab3661a05fbd5faaae82918a9962f0b93b855f97993ec975eeaa80d740adbf4ff747359d041d5c33ea71d281e446b14773bca97b43a23fb801676bd207a436c6481f1d2b9078717461a5b9d32e688f87748544523b524b0d57d5ea77a2775d2ecfa032cfbdbf52fb3786160279004e57ae6af874e7303ce53299ccc041c7bc308d82a5698f3a8d0c38271ae35f8e9dbfbb694b5c803d89f7ae435de236d525f54759b65e372fcd68ef20fa7111f9e4aff73'

const G = 2n
const N = BigInt(`0x${SRP_2048_N_HEX}`)

function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  if (m === 1n) return 0n
  let b = base % m
  let e = exp
  let r = 1n
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m
    e >>= 1n
    b = (b * b) % m
  }
  return r
}

/** Big-endian minimal length, matching `BigUint::to_bytes_be` (no leading zero). */
function bigToBytesBE(n: bigint): Uint8Array {
  if (n === 0n) return new Uint8Array([0])
  let hex = n.toString(16)
  if (hex.length % 2 === 1) hex = `0${hex}`
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return out
}

function concatBytes(...parts: Array<Uint8Array>): Uint8Array {
  const len = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(len)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(data.length)
  copy.set(data)
  const buf = await crypto.subtle.digest('SHA-256', copy)
  return new Uint8Array(buf)
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(h: string): Uint8Array {
  const s = h.replace(/\s+/g, '').toLowerCase()
  const out = new Uint8Array(s.length / 2)
  for (let i = 0; i < s.length; i += 2) {
    out[i / 2] = parseInt(s.slice(i, i + 2), 16)
  }
  return out
}

function bytesToBigBE(b: Uint8Array): bigint {
  let r = 0n
  for (const byte of b) r = (r << 8n) | BigInt(byte)
  return r
}

async function computeK(): Promise<bigint> {
  const nBytes = bigToBytesBE(N)
  const gBytes = bigToBytesBE(G)
  const paddedG = new Uint8Array(nBytes.length)
  paddedG.set(gBytes, nBytes.length - gBytes.length)
  const h = await sha256(concatBytes(nBytes, paddedG))
  return bytesToBigBE(h)
}

/** u = H(A | B) with unpadded big-endian encodings (see `srp` crate `compute_u`). */
async function computeU(aPub: bigint, bPub: bigint): Promise<bigint> {
  const h = await sha256(concatBytes(bigToBytesBE(aPub), bigToBytesBE(bPub)))
  return bytesToBigBE(h)
}

function clientPremaster(
  bPub: bigint,
  k: bigint,
  x: bigint,
  a: bigint,
  u: bigint,
): bigint {
  const kgx = (k * modPow(G, x, N)) % N
  const base = (N + bPub - kgx) % N
  const exp = u * x + a
  return modPow(base, exp, N)
}

export function generateLoginEphemeral(): { public: string; secret: string } {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  const a = bytesToBigBE(buf)
  const aPub = modPow(G, a, N)
  return {
    public: bytesToHex(bigToBytesBE(aPub)),
    secret: bytesToHex(buf),
  }
}

export type RustSrpClientSession = {
  aPubHex: string
  clientProofHex: string
  /** Premaster secret bytes (minimal BE), for M2 verification. */
  premasterBytes: Uint8Array
}

/** Finish the client side of login using `x` from {@link deriveSrpPrivateKey}. */
export async function deriveLoginSessionRust(
  clientSecretHex: string,
  serverPublicHex: string,
  privateKeyHex: string,
): Promise<RustSrpClientSession> {
  const a = BigInt(`0x${clientSecretHex}`)
  const bPub = BigInt(`0x${serverPublicHex}`)
  const x = BigInt(`0x${privateKeyHex}`)

  const aPub = modPow(G, a, N)
  if (bPub % N === 0n) {
    throw new Error('Invalid server public ephemeral')
  }

  const k = await computeK()
  const u = await computeU(aPub, bPub)
  const premaster = clientPremaster(bPub, k, x, a, u)
  const premasterBytes = bigToBytesBE(premaster)

  const m1 = await sha256(
    concatBytes(bigToBytesBE(aPub), bigToBytesBE(bPub), premasterBytes),
  )

  return {
    aPubHex: bytesToHex(bigToBytesBE(aPub)),
    clientProofHex: bytesToHex(m1),
    premasterBytes,
  }
}

export async function verifyLoginServerProofRust(
  aPubHex: string,
  clientProofHex: string,
  premasterBytes: Uint8Array,
  serverProofHex: string,
): Promise<void> {
  const aPub = BigInt(`0x${aPubHex}`)
  const m1 = hexToBytes(clientProofHex)
  const m2 = await sha256(concatBytes(bigToBytesBE(aPub), m1, premasterBytes))
  const expected = serverProofHex.replace(/\s+/g, '').toLowerCase()
  const actual = bytesToHex(m2)
  if (actual !== expected) {
    throw new Error('Invalid server session proof')
  }
}

/** 32-byte salt as 64 hex chars (matches the former `local-srp-client` `generateSalt`). */
export function generateSrpRegistrationSalt(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return bytesToHex(buf)
}

const textEncoder = new TextEncoder()

/**
 * x = H(salt ‖ H(NFKC(identity) ‖ ":" ‖ NFKC(password))) — `srp` crate `SrpClient::compute_x`,
 * with NFKC on credential strings (same as the old `local-srp-client` client).
 */
export async function deriveSrpPrivateKey(
  saltHex: string,
  identity: string,
  password: string,
): Promise<string> {
  const iu = identity.normalize('NFKC')
  const ip = password.normalize('NFKC')
  const inner = await sha256(textEncoder.encode(`${iu}:${ip}`))
  const saltBytes = hexToBytes(saltHex)
  const xDigest = await sha256(concatBytes(saltBytes, inner))
  return bytesToHex(xDigest)
}

/** Verifier v = g^x mod N as 256-byte big-endian hex (512 hex chars), per API validation. */
export function deriveSrpVerifier(privateKeyHex: string): string {
  const x = BigInt(`0x${privateKeyHex}`)
  const v = modPow(G, x, N)
  const raw = bigToBytesBE(v)
  if (raw.length > 256) {
    throw new Error('SRP verifier exceeds group size')
  }
  const padded = new Uint8Array(256)
  padded.set(raw, 256 - raw.length)
  return bytesToHex(padded)
}
