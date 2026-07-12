// Prisma v7 config — URLs managed here, NOT in schema.prisma
// DATABASE_URL  → pooled connection (pgbouncer) used by PrismaClient at runtime
// DIRECT_URL    → direct connection used by Prisma Migrate / db push
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? (process.env["DATABASE_URL"] as string),
  },
});
