/**
 * Engine output storage (database-design.md §6).
 *
 * IMPORTANT: these tables are STORAGE ONLY. The tax engine that *populates* them
 * (the form-line dependency graph + fixed-point solver of
 * tax-engine-specification.md) is intentionally NOT implemented in this
 * foundation. The schema exists so the data layer is complete and the engine can
 * slot in later without a migration.
 *
 * `tax_calculations` rows are immutable, append-only snapshots; `form_line_values`
 * is the single source of truth that the PDF renderer and MeF serializer read.
 */
import {
    pgTable,
    uuid,
    text,
    bigint,
    smallint,
    boolean,
    jsonb,
    timestamp,
    index,
    primaryKey,
} from "drizzle-orm/pg-core"
import { taxReturns } from "./returns"

export const taxCalculations = pgTable(
    "tax_calculations",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: uuid("return_id")
            .notNull()
            .references(() => taxReturns.id),
        taxYear: smallint("tax_year").notNull(),
        /** Which ruleset version computed this (tax-engine-specification.md §5.1). */
        rulesetId: text("ruleset_id").notNull(),
        /** Engine code version (semver/sha) that produced this result. */
        engineVersion: text("engine_version").notNull(),
        /** Hash of the fact snapshot — incremental-recompute cache key. */
        inputsHash: text("inputs_hash").notNull(),
        /** Fixed-point convergence flag (tax-engine-specification.md §3.3). */
        converged: boolean("converged").notNull(),
        iterations: smallint("iterations").notNull(),
        nonconvergenceReason: text("nonconvergence_reason"),
        // Denormalized headline summary (all integer cents).
        totalIncomeCents: bigint("total_income_cents", { mode: "number" }),
        agiCents: bigint("agi_cents", { mode: "number" }),
        deductionCents: bigint("deduction_cents", { mode: "number" }),
        usingItemized: boolean("using_itemized"),
        taxableIncomeCents: bigint("taxable_income_cents", { mode: "number" }),
        taxBeforeCreditsCents: bigint("tax_before_credits_cents", { mode: "number" }),
        creditsCents: bigint("credits_cents", { mode: "number" }),
        taxAfterCreditsCents: bigint("tax_after_credits_cents", { mode: "number" }),
        withholdingCents: bigint("withholding_cents", { mode: "number" }),
        /** Positive = refund, negative = balance due. */
        refundOrDueCents: bigint("refund_or_due_cents", { mode: "number" }),
        /** Marginal rate in basis points (2400 = 24%). */
        marginalRateBp: smallint("marginal_rate_bp"),
        computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        returnTimeIdx: index("tax_calculations_return_time_idx").on(t.returnId, t.computedAt),
        inputsHashIdx: index("tax_calculations_inputs_hash_idx").on(t.returnId, t.inputsHash),
    }),
)

export const formLineValues = pgTable(
    "form_line_values",
    {
        calculationId: uuid("calculation_id")
            .notNull()
            .references(() => taxCalculations.id),
        /** e.g. 'F1040' | 'SCH1' | 'F8962'. */
        formId: text("form_id").notNull(),
        /** e.g. 'L11' | 'L6b'. */
        lineId: text("line_id").notNull(),
        valueCents: bigint("value_cents", { mode: "number" }),
        valueText: text("value_text"),
        /** IRS publication/form citation for audit-grade explainability. */
        citePubRef: text("cite_pub_ref"),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.calculationId, t.formId, t.lineId] }),
    }),
)

/** Citation-linked explainability trace, one JSONB blob per calculation. */
export const calculationTraces = pgTable("calculation_traces", {
    calculationId: uuid("calculation_id")
        .primaryKey()
        .references(() => taxCalculations.id),
    trace: jsonb("trace").notNull(),
})

export type TaxCalculation = typeof taxCalculations.$inferSelect
export type NewTaxCalculation = typeof taxCalculations.$inferInsert
export type FormLineValue = typeof formLineValues.$inferSelect
export type NewFormLineValue = typeof formLineValues.$inferInsert
