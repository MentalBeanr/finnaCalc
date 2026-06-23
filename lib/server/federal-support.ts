/**
 * Federal tax support: run the engine on a return's inputs and persist the
 * result as an immutable calculation snapshot (database-design.md §6).
 *
 * The interview shows an ephemeral estimate; this layer is where a reviewed
 * calculation becomes a stored snapshot — tax_calculations + form_line_values
 * (the single source the PDF/MeF layers will read) + the explainability trace.
 */
import { createHash } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { getDb } from "@/db/client"
import {
    calculationTraces,
    formLineValues,
    taxCalculations,
    type TaxCalculation,
    type TaxReturn,
} from "@/db/schema"
import {
    ENGINE_VERSION,
    computeFederalReturn,
    type FederalReturnInput,
    type FederalReturnResult,
} from "@/tax-engine"
import { mapToFederalInput } from "@/lib/interview-shared"
import { splitNodeId } from "@/lib/federal-support-shared"
import { getReturn } from "./returns"
import { getQualifyingChildren, listDeductions, listIncome } from "./return-inputs"

export interface BuiltReturn {
    ret: TaxReturn
    incomeCount: number
    input: FederalReturnInput | null
}

/** Assemble the engine input from a return's stored data (user-scoped). */
export async function buildFederalInputForReturn(
    userId: string,
    returnId: string,
): Promise<BuiltReturn | null> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return null
    const [income, deductions, numChildren] = await Promise.all([
        listIncome(userId, returnId),
        listDeductions(userId, returnId),
        getQualifyingChildren(userId, returnId),
    ])
    const input = mapToFederalInput({
        filingStatus: ret.filingStatus,
        income: income.map((r) => ({
            type: r.type,
            amountCents: r.amountCents,
            withholdingCents: r.withholdingCents,
            metadata: (r.metadata as Record<string, unknown>) ?? {},
        })),
        numChildren,
        deductions: deductions.map((d) => ({ type: d.type, amountCents: d.amountCents })),
    })
    return { ret, incomeCount: income.length, input }
}

/** Compute the ephemeral federal result for display (no persistence). */
export async function computeForReturn(
    userId: string,
    returnId: string,
): Promise<FederalReturnResult | null> {
    const built = await buildFederalInputForReturn(userId, returnId)
    if (!built || !built.input) return null
    return computeFederalReturn(built.input)
}

/**
 * Run and persist a calculation snapshot. Idempotent on the input hash: if the
 * most recent snapshot was computed from identical inputs, it is reused.
 */
export async function runCalculation(
    userId: string,
    returnId: string,
): Promise<{ calculationId: string } | null> {
    const built = await buildFederalInputForReturn(userId, returnId)
    if (!built || !built.input) return null

    const result = computeFederalReturn(built.input)
    const inputsHash = createHash("sha256").update(JSON.stringify(built.input)).digest("hex")
    const db = getDb()

    const [latest] = await db
        .select()
        .from(taxCalculations)
        .where(eq(taxCalculations.returnId, returnId))
        .orderBy(desc(taxCalculations.computedAt))
        .limit(1)
    if (latest && latest.inputsHash === inputsHash) {
        return { calculationId: latest.id }
    }

    const flv = result.formLineValues
    const totalIncome =
        (flv["F1040.L1a"] ?? 0) + (flv["F1040.L2b"] ?? 0) + (flv["F1040.L6b"] ?? 0)

    const [calc] = await db
        .insert(taxCalculations)
        .values({
            returnId,
            taxYear: result.taxYear,
            rulesetId: "federal:ty2024",
            engineVersion: ENGINE_VERSION,
            inputsHash,
            converged: result.converged,
            iterations: result.iterations,
            totalIncomeCents: totalIncome,
            agiCents: result.agiCents,
            deductionCents: result.deductionCents,
            usingItemized: false,
            taxableIncomeCents: result.taxableIncomeCents,
            taxBeforeCreditsCents: result.taxBeforeCreditsCents,
            creditsCents: result.creditsCents,
            taxAfterCreditsCents: result.taxAfterCreditsCents,
            withholdingCents: result.withholdingCents,
            refundOrDueCents: result.refundOrDueCents,
            marginalRateBp: result.marginalRateBp,
        })
        .returning()

    const citations = new Map(result.trace.map((t) => [t.nodeId, t.citation]))
    const rows = Object.entries(flv).map(([nodeId, value]) => {
        const { formId, lineId } = splitNodeId(nodeId)
        return {
            calculationId: calc.id,
            formId,
            lineId,
            valueCents: Math.round(value),
            citePubRef: citations.get(nodeId) ?? null,
        }
    })
    if (rows.length > 0) await db.insert(formLineValues).values(rows)
    await db.insert(calculationTraces).values({ calculationId: calc.id, trace: result.trace })

    return { calculationId: calc.id }
}

/** The most recent persisted snapshot for a return (user-scoped), or null. */
export async function getLatestCalculation(
    userId: string,
    returnId: string,
): Promise<TaxCalculation | null> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return null
    const db = getDb()
    const [calc] = await db
        .select()
        .from(taxCalculations)
        .where(and(eq(taxCalculations.returnId, returnId)))
        .orderBy(desc(taxCalculations.computedAt))
        .limit(1)
    return calc ?? null
}
