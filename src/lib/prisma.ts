import { PrismaD1 } from "@prisma/adapter-d1";
import type { PrismaClient } from "@/generated/prisma/client";
import { PrismaClient as PrismaClientCtor } from "@/generated/prisma/client";

/**
 * Prisma bound to Cloudflare D1 (same binding as raw `D1Database` usage elsewhere).
 * Call `await prisma.$disconnect()` at the end of the request path when practical.
 * @param d1 Bound D1 database instance.
 */
export function createPrismaClient(d1: D1Database): PrismaClient {
  const adapter = new PrismaD1(d1);
  return new PrismaClientCtor({ adapter });
}

/**
 * Runs async work with a short-lived client and guaranteed disconnect (Workers / Route Handlers).
 * @param d1 Bound D1 database.
 * @param fn Callback receiving a Prisma client.
 */
export async function withPrisma<T>(
  d1: D1Database,
  fn: (prisma: PrismaClient) => Promise<T>,
): Promise<T> {
  const prisma = createPrismaClient(d1);
  try {
    return await fn(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
