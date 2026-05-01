import path from "node:path";
import { pathToFileURL } from "node:url";

import { defineConfig } from "prisma/config";

const defaultSqliteUri = pathToFileURL(
  path.join(process.cwd(), "prisma", "dev.sqlite"),
).href;

/** Used by Prisma CLI (generate, migrate diff, studio). Edge runtime queries use `PrismaD1` + binding `env.DB`. */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL ?? defaultSqliteUri,
  },
});
