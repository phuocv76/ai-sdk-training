import { compare, genSalt, hash } from "bcrypt";

/** Cost factor for new password hashes. */
const BCRYPT_ROUNDS = 12;

/** Legacy PBKDF2-SHA256 encoding (verify-only for existing rows). */
const LEGACY_PREFIX = "pbkdf2-sha256";

const b64decode = (s: string): Uint8Array => {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const derive = async (
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> => {
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
};

const verifyLegacyPbkdf2 = async (
  password: string,
  stored: string,
): Promise<boolean> => {
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
};

/**
 * Produces a bcrypt password hash (`genSalt` + `hash`).
 * @param password Plain-text password from the client.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await genSalt(BCRYPT_ROUNDS);
  return hash(password, salt);
};

/**
 * Verifies a plaintext password against a stored hash (bcrypt or legacy PBKDF2).
 * @param password Candidate password.
 * @param stored Bcrypt string, legacy `pbkdf2-sha256:...` string, or absent.
 */
export const verifyPassword = async (
  password: string,
  stored: string | null | undefined,
): Promise<boolean> => {
  if (!stored) return false;

  if (stored.startsWith("$2")) {
    try {
      return await compare(password, stored);
    } catch {
      return false;
    }
  }

  if (stored.startsWith(`${LEGACY_PREFIX}:`)) {
    return verifyLegacyPbkdf2(password, stored);
  }

  return false;
};
