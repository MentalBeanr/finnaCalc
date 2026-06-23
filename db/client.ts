/**
 * Database client (lazy, build-safe).
 *
 * The connection is created on first use, never at import time, so `next build`
 * and CI (which run without a DATABASE_URL) never attempt to connect. A missing
 * DATABASE_URL throws only when the database is actually used at runtime.
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

type Database = PostgresJsDatabase<typeof schema>

let cached: { client: postgres.Sql; db: Database } | null = null

function init(): { client: postgres.Sql; db: Database } {
    const url = process.env.DATABASE_URL
    if (!url) {
        throw new Error(
            "DATABASE_URL is not set. The tax-platform database is required at runtime " +
                "but is intentionally not connected during build/CI.",
        )
    }
    // `prepare: false` is friendly to transaction-pooling proxies (e.g. PgBouncer).
    const client = postgres(url, { prepare: false })
    const db = drizzle(client, { schema })
    cached = { client, db }
    return cached
}

/** Returns the shared Drizzle database instance, connecting on first call. */
export function getDb(): Database {
    return (cached ?? init()).db
}

/** Returns the underlying postgres.js client (for migrations / health checks). */
export function getSql(): postgres.Sql {
    return (cached ?? init()).client
}

export { schema }
export type { Database }
