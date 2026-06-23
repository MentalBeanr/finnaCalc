/**
 * Identity tables.
 *
 * `users` holds NO SSN (database-design.md §4.1) — credentials live with the
 * managed IdP and the crown-jewel identifiers live in the separate PII vault
 * store, referenced here only by opaque token.
 */
import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { userStatus } from "./enums"

export const users = pgTable(
    "users",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        /** Unique account email. */
        email: text("email").notNull().unique(),
        /** Subject identifier from the managed identity provider (lib/server/auth.ts). */
        authProviderRef: text("auth_provider_ref").notNull(),
        displayName: text("display_name"),
        mfaEnabled: boolean("mfa_enabled").notNull().default(false),
        locale: text("locale").notNull().default("en-US"),
        status: userStatus("status").notNull().default("active"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
        /** Soft-close; retention-bound (never hard-deleted — database-design.md §17). */
        closedAt: timestamp("closed_at", { withTimezone: true }),
    },
    (t) => ({
        authProviderRefIdx: index("users_auth_provider_ref_idx").on(t.authProviderRef),
    }),
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
