/**
 * Returns and the people on them.
 *
 * A `tax_returns` row is the mutable shell with a state machine; the immutable
 * filed snapshot lives in tax_calculations + form_line_values. Every person on
 * the return — taxpayer, spouse, and each dependent (including minors) — is a
 * vault-protected identity, referenced here only by token (database-design.md
 * §4.3, §5.1).
 */
import {
    pgTable,
    uuid,
    text,
    smallint,
    boolean,
    char,
    date,
    timestamp,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core"
import { users } from "./identity"
import { filingStatus, returnState, returnKind, personRole, ssnStatus } from "./enums"

export const taxReturns = pgTable(
    "tax_returns",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id),
        taxYear: smallint("tax_year").notNull(),
        kind: returnKind("kind").notNull().default("original"),
        /** Non-null iff kind = 'amendment' (database-design.md §16.5). */
        amendsReturnId: uuid("amends_return_id"),
        filingStatus: filingStatus("filing_status"),
        /** USPS code; selects the state engine when state filing is supported. */
        stateOfResidence: char("state_of_residence", { length: 2 }),
        /** Engine ruleset binding, e.g. 'ty2024' (tax-engine-specification.md §5). */
        rulesetId: text("ruleset_id"),
        state: returnState("state").notNull().default("draft"),
        /** 'supported' or a decline reason code (detect-and-decline, v2 §3.3). */
        inScopeDecision: text("in_scope_decision"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
        submittedAt: timestamp("submitted_at", { withTimezone: true }),
        acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    },
    (t) => ({
        userYearIdx: index("tax_returns_user_year_idx").on(t.userId, t.taxYear),
    }),
)

export const returnPeople = pgTable(
    "return_people",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: uuid("return_id")
            .notNull()
            .references(() => taxReturns.id),
        role: personRole("role").notNull(),
        /** 0 = taxpayer, 1 = spouse, 2..N = dependents (database-design.md §4.3). */
        ordinal: smallint("ordinal").notNull(),
        /** → pii_vault.person_identity(token); the SSN itself never lives here. */
        personVaultToken: uuid("person_vault_token").notNull(),
        legalFirstName: text("legal_first_name").notNull(),
        legalLastName: text("legal_last_name").notNull(),
        dateOfBirth: date("date_of_birth").notNull(),
        /** Heightened retention/breach handling for minors (database-design.md §6.3). */
        isMinor: boolean("is_minor").notNull(),
        relationship: text("relationship"),
        qualifyingChild: boolean("qualifying_child"),
        qualifyingRelative: boolean("qualifying_relative"),
        ssnStatus: ssnStatus("ssn_status"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        returnOrdinalUniq: uniqueIndex("return_people_return_ordinal_uniq").on(
            t.returnId,
            t.ordinal,
        ),
        vaultTokenIdx: index("return_people_vault_token_idx").on(t.personVaultToken),
    }),
)

export type TaxReturn = typeof taxReturns.$inferSelect
export type NewTaxReturn = typeof taxReturns.$inferInsert
export type ReturnPerson = typeof returnPeople.$inferSelect
export type NewReturnPerson = typeof returnPeople.$inferInsert
