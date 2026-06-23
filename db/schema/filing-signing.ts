/**
 * Consent and e-signature records (database-design.md §10).
 *
 * §7216 consents are separately recorded; the taxpayer self-signs via Self-Select
 * PIN. Sensitive values (prior-year AGI, IP PIN) are NOT stored here — only the
 * verification result — because those belong in the PII vault and the MeF payload
 * (tax-platform-architecture-v2.md §6.5).
 */
import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core"
import { users } from "./identity"
import { taxReturns } from "./returns"

export const consentsSigned = pgTable(
    "consents_signed",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id),
        returnId: uuid("return_id").references(() => taxReturns.id),
        /** e.g. '7216_use' | '7216_disclosure' | 'esign_disclosure'. */
        consentType: text("consent_type").notNull(),
        version: text("version").notNull(),
        accepted: boolean("accepted").notNull().default(true),
        signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        returnIdx: index("consents_signed_return_idx").on(t.returnId, t.consentType),
    }),
)

export const eSignatures = pgTable(
    "e_signatures",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: uuid("return_id")
            .notNull()
            .references(() => taxReturns.id),
        /** 'self_select_pin'. */
        method: text("method").notNull(),
        /** Verification result only — the AGI value itself is never stored here. */
        priorYearAgiMatch: boolean("prior_year_agi_match").notNull(),
        /** Whether the return carried an IP PIN (the PIN value lives in the vault). */
        ipPinPresent: boolean("ip_pin_present").notNull().default(false),
        signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        returnUniq: uniqueIndex("e_signatures_return_uniq").on(t.returnId),
    }),
)

export type ConsentSigned = typeof consentsSigned.$inferSelect
export type ESignature = typeof eSignatures.$inferSelect
