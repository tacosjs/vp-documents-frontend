/** SHA-256 hex of UTF-8 string (matches server `Sha256::digest(key.as_bytes())`). */
export async function sha256HexUtf8(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
