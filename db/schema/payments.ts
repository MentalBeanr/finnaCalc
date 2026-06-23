/**
 * Payments (database-design.md §9.2).
 *
 * Filing-fee payments (a normal PSP like Stripe) and IRS-rail references
 * (balance-due/refund via sanctioned ACH) are the SAME shape but distinct
 * `kind`s — they never share a processor. All money is integer cents.
 */
import { pgTable, uuid, text, bigint, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core"
import { users } from "./identity"
import { taxReturns } from "./returns"
import { paymentKind, paymentStatus } from "./enums"

export const payments = pgTable(
    "payments",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id),
        returnId: uuid("return_id").references(() => taxReturns.id),
        kind: paymentKind("kind").notNull(),
        amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
        /** 'stub' | 'stripe' | 'irs_direct_debit' | 'irs_refund' (database-design.md §4.3). */
        processor: text("processor").notNull(),
        processorRef: text("processor_ref").notNull(),
        status: paymentStatus("status").notNull().default("pending"),
        /** Makes charge creation safe under retries. */
        idempotencyKey: text("idempotency_key").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        idempotencyUniq: uniqueIndex("payments_idempotency_uniq").on(t.idempotencyKey),
        userIdx: index("payments_user_idx").on(t.userId, t.createdAt),
    }),
)

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
