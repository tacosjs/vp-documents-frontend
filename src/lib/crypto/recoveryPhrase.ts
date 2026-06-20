import { sha256HexUtf8 } from './sha256Hex'

/** Matches server `validation::normalize_recovery_phrase` for hashing and typing. */
export const normalizeRecoveryPhrase = (phrase: string): string =>
  phrase
    .trim()
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .join(' ')

export const hashRecoveryPhraseSha256Hex = async (
  phrase: string,
): Promise<string> => sha256HexUtf8(normalizeRecoveryPhrase(phrase))
