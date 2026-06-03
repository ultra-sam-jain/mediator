import { createDecipheriv, createHash } from 'crypto'

function normalizeCiphertext(input: string): Buffer {
  const trimmed = input.trim()
  try {
    return Buffer.from(trimmed, 'base64')
  } catch {
    return Buffer.from(trimmed, 'utf8')
  }
}

function keyVariants(encryptionKey: string): Buffer[] {
  const variants: Buffer[] = []
  if (/^[0-9a-fA-F]{32}$/.test(encryptionKey)) {
    variants.push(Buffer.from(encryptionKey, 'hex'))
  }
  variants.push(Buffer.from(encryptionKey, 'utf8'))
  variants.push(createHash('md5').update(encryptionKey).digest())
  variants.push(createHash('sha256').update(encryptionKey).digest().subarray(0, 16))
  return variants
}

function sliceKey(key: Buffer, len: number): Buffer {
  if (key.length === len) return key
  if (key.length > len) return key.subarray(0, len)
  return createHash('sha256').update(key).digest().subarray(0, len)
}

function looksLikeLeadJson(text: string): boolean {
  const t = text.trim()
  if (!t.startsWith('{') && !t.startsWith('[')) return false
  try {
    JSON.parse(t)
    return true
  } catch {
    return false
  }
}

function tryDecrypt(
  ciphertext: Buffer,
  key: Buffer,
  algorithm: 'aes-128-ecb' | 'aes-256-ecb' | 'aes-128-cbc' | 'aes-256-cbc',
  iv?: Buffer,
): string | null {
  const keyLen = algorithm.includes('256') ? 32 : 16
  const k = sliceKey(key, keyLen)
  try {
    const decipher = createDecipheriv(algorithm, k, iv ?? null)
    decipher.setAutoPadding(true)
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    const text = plain.toString('utf8')
    return looksLikeLeadJson(text) ? text : null
  } catch {
    return null
  }
}

/** Decrypt Housing-style AES payloads (hex key, ECB/CBC). Returns JSON string or null. */
export function decryptHousingCiphertext(
  ciphertext: string,
  encryptionKey: string,
): string | null {
  const buf = normalizeCiphertext(ciphertext)
  if (buf.length < 8) return null

  for (const key of keyVariants(encryptionKey)) {
    for (const alg of ['aes-128-ecb', 'aes-256-ecb'] as const) {
      const text = tryDecrypt(buf, key, alg)
      if (text) return text
    }

    if (buf.length > 16) {
      const iv = buf.subarray(0, 16)
      const enc = buf.subarray(16)
      for (const alg of ['aes-128-cbc', 'aes-256-cbc'] as const) {
        const text = tryDecrypt(enc, key, alg, iv)
        if (text) return text
      }
    }
  }

  return null
}

export const HOUSING_ENCRYPTED_FIELD_KEYS = [
  'data',
  'Data',
  'encrypted_data',
  'encryptedData',
  'payload',
  'lead_data',
  'response',
  'Response',
  'lead',
] as const
