/**
 * Public entry point for the tax-platform data layer.
 *
 * Usage (server-only):
 *   import { getDb, schema } from "@/db"
 *   const db = getDb()
 *   const rows = await db.select().from(schema.taxReturns)...
 */
export { getDb, getSql, schema, type Database } from "./client"
export * from "./schema"
