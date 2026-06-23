/**
 * Drizzle Kit configuration — schema → SQL migration generation.
 *
 * Generate after editing the schema:   pnpm db:generate
 * Apply migrations to a database:       pnpm db:migrate
 *
 * `db:generate` reads only the TypeScript schema and needs no database
 * connection; `db:migrate` requires DATABASE_URL.
 */
import type { Config } from "drizzle-kit"

export default {
    schema: "./db/schema/index.ts",
    out: "./db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL ?? "",
    },
    strict: true,
    verbose: true,
} satisfies Config
