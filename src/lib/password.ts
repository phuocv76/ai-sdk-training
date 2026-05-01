const PREFIX = "pbkdf2-sha256";
const ITERATIONS = 210_000;

/**
 * Generates `len` cryptographically secure random bytes.
 * @param len Number of bytes.
 */
function randomBytes(len: number): Uint8Array {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return b;
}

/**
 * Base64-encodes binary data for storage in the hashed password string.
 * @param buf Bytes to encode.
 */
function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]!);
  return btoa(s);
}

/**
 * Decodes stored base64 segments back into bytes.
 * @param s Standard base64 string.
 */
function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Produces an encoded PBKDF2-SHA256 password string with embedded salt and parameters.
 * @param password Plain-text password from the client.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}:${ITERATIONS}:${b64encode(salt)}:${b64encode(hash)}`;
}

/**
 * Verifies a plaintext password against a stored encoded hash (timing-safe comparison).
 * @param password Candidate password.
 * @param stored Serialized hash from `hashPassword`, or absent for passwordless users.
 */
export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored?.startsWith(`${PREFIX}:`)) return false;
  const parts = stored.split(":");
  if (parts.length !== 4) return false;
  const [, iterRaw, saltB64, hashB64] = parts;
  const iterations = Number(iterRaw);
  if (
    !Number.isFinite(iterations) ||
    iterations < 100_000 ||
    iterations > 1_000_000 ||
    !saltB64 ||
    !hashB64
  ) {
    return false;
  }
  try {
    const salt = b64decode(saltB64);
    const expected = b64decode(hashB64);
    const actual = await derive(password, salt, iterations);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) {
      diff |= actual[i]! ^ expected[i]!;
    }
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * Derives a 32-byte key using Web Crypto PBKDF2.
 * @param password User password bytes.
 * @param salt Random salt.
 * @param iterations PBKDF2 iteration count.
 */
async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt.buffer.slice(
        salt.byteOffset,
        salt.byteOffset + salt.byteLength,
      ) as BufferSource,
      iterations,
    },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}
