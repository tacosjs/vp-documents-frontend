import { enums } from 'openpgp'
import type { PartialConfig } from 'openpgp'

/**
 * Pinned OpenPGP.js policy for **new** encryption and key generation.
 * Do not pass this to `decrypt`, `readMessage`, or `readPrivateKey` — older
 * armored blobs (e.g. v4 keys, legacy S2K) must still decrypt with defaults.
 */
export const appOpenPgpEncryptConfig: PartialConfig = {
  aeadProtect: true,
  preferredAEADAlgorithm: enums.aead.gcm,
  preferredCompressionAlgorithm: enums.compression.uncompressed,
  preferredHashAlgorithm: enums.hash.sha256,
  preferredSymmetricAlgorithm: enums.symmetric.aes256,
  rejectHashAlgorithms: new Set([enums.hash.md5, enums.hash.sha1]),
  s2kType: enums.s2k.argon2,
  v6Keys: true,
  s2kArgon2Params: {
    memoryExponent: 16,
    parallelism: 4,
    passes: 3,
  },
}
