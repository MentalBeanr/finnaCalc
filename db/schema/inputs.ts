/**
 * User-asserted return inputs: income, deductions, credits.
 *
 * These are facts the user supplies. What the engine *allows* (vs. what is
 * claimed) is a computed form-line value, not stored here. All money is integer
 * cents in BIGINT (database-design.md §1, §5.2–5.3).
 */
import { pgTable, uuid, text, bigint, smallint, jsonb, timestamp, index } from "drizzle-orm/pg-core"
import { taxReturns, returnPeople } from "./returns"
import { incomeType, deductionType, creditType } from "./enums"

export const incomeSources = pgTable(
    "income_sources",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: uuid("return_id")
            .notNull()
            .references(() => taxReturns.id),
        type: incomeType("type").notNull(),
        payerName: text("payer_name"),
        amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
        withholdingCents: bigint("withholding_cents", { mode: "number" }).notNull().default(0),
        /** Whose income (taxpayer/spouse) — database-design.md §5.2. */
        personId: uuid("person_id").references(() => returnPeople.id),
        /** Box-level fields (W-2 box 12, 1099-B lot refs, etc.). */
        metadata: jsonb("metadata").notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        returnIdx: index("income_sources_return_idx").on(t.returnId),
        returnTypeIdx: index("income_sources_return_type_idx").on(t.returnId, t.type),
    }),
)

export const deductionsClaimed = pgTable(
    "deductions_claimed",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: uuid("return_id")
            .notNull()
            .references(() => taxReturns.id),
        type: deductionType("type").notNull(),
        amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
        metadata: jsonb("metadata").notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        returnIdx: index("deductions_claimed_return_idx").on(t.returnId),
    }),
)

export const creditsClaimed = pgTable(
    "credits_claimed",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: uuid("return_id")
            .notNull()
            .references(() => taxReturns.id),
        type: creditType("type").notNull(),
        qualifyingCount: smallint("qualifying_count"),
        amountClaimedCents: bigint("amount_claimed_cents", { mode: "number" }),
        metadata: jsonb("metadata").notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        returnIdx: index("credits_claimed_return_idx").on(t.returnId),
    }),
)

export type IncomeSource = typeof incomeSources.$inferSelect
export type NewIncomeSource = typeof incomeSources.$inferInsert
export type DeductionClaimed = typeof deductionsClaimed.$inferSelect
export type NewDeductionClaimed = typeof deductionsClaimed.$inferInsert
export type CreditClaimed = typeof creditsClaimed.$inferSelect
export type NewCreditClaimed = typeof creditsClaimed.$inferInsert
