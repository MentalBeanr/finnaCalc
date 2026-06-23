/**
 * Return inputs service: the income line items, deductions, and
 * qualifying-children count the interview collects. User-scoped via the owning return.
 */
import { and, asc, eq } from "drizzle-orm"
import { getDb } from "@/db/client"
import {
    creditsClaimed,
    deductionsClaimed,
    incomeSources,
    type DeductionClaimed,
    type IncomeSource,
} from "@/db/schema"
import { getReturn } from "./returns"

export async function listIncome(userId: string, returnId: string): Promise<IncomeSource[]> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return []
    const db = getDb()
    return db
        .select()
        .from(incomeSources)
        .where(eq(incomeSources.returnId, returnId))
        .orderBy(asc(incomeSources.createdAt))
}

export interface AddIncomeInput {
    type: IncomeSource["type"]
    amountCents: number
    withholdingCents?: number
    metadata?: Record<string, unknown>
}

export async function addIncome(
    userId: string,
    returnId: string,
    input: AddIncomeInput,
): Promise<IncomeSource | null> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return null
    const db = getDb()
    const [row] = await db
        .insert(incomeSources)
        .values({
            returnId,
            type: input.type,
            amountCents: input.amountCents,
            withholdingCents: input.withholdingCents ?? 0,
            metadata: input.metadata ?? {},
        })
        .returning()
    return row
}

export async function removeIncome(
    userId: string,
    returnId: string,
    incomeId: string,
): Promise<boolean> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return false
    const db = getDb()
    await db
        .delete(incomeSources)
        .where(and(eq(incomeSources.id, incomeId), eq(incomeSources.returnId, returnId)))
    return true
}

/** The qualifying-children count drives the (simplified) Child Tax Credit. */
export async function getQualifyingChildren(userId: string, returnId: string): Promise<number> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return 0
    const db = getDb()
    const [row] = await db
        .select()
        .from(creditsClaimed)
        .where(and(eq(creditsClaimed.returnId, returnId), eq(creditsClaimed.type, "ctc")))
        .limit(1)
    return row?.qualifyingCount ?? 0
}

// ── Deductions ────────────────────────────────────────────────────────────────

export async function listDeductions(
    userId: string,
    returnId: string,
): Promise<DeductionClaimed[]> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return []
    const db = getDb()
    return db
        .select()
        .from(deductionsClaimed)
        .where(eq(deductionsClaimed.returnId, returnId))
        .orderBy(asc(deductionsClaimed.createdAt))
}

export interface AddDeductionInput {
    type: DeductionClaimed["type"]
    amountCents: number
}

export async function addDeduction(
    userId: string,
    returnId: string,
    input: AddDeductionInput,
): Promise<DeductionClaimed | null> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return null
    const db = getDb()
    const [row] = await db
        .insert(deductionsClaimed)
        .values({ returnId, type: input.type, amountCents: input.amountCents })
        .returning()
    return row
}

export async function removeDeduction(
    userId: string,
    returnId: string,
    deductionId: string,
): Promise<boolean> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return false
    const db = getDb()
    await db
        .delete(deductionsClaimed)
        .where(
            and(eq(deductionsClaimed.id, deductionId), eq(deductionsClaimed.returnId, returnId)),
        )
    return true
}

// ── Qualifying children ────────────────────────────────────────────────────────

export async function setQualifyingChildren(
    userId: string,
    returnId: string,
    count: number,
): Promise<boolean> {
    const ret = await getReturn(userId, returnId)
    if (!ret) return false
    const safe = Math.max(0, Math.round(count))
    const db = getDb()
    const [existing] = await db
        .select()
        .from(creditsClaimed)
        .where(and(eq(creditsClaimed.returnId, returnId), eq(creditsClaimed.type, "ctc")))
        .limit(1)
    if (existing) {
        await db
            .update(creditsClaimed)
            .set({ qualifyingCount: safe, updatedAt: new Date() })
            .where(eq(creditsClaimed.id, existing.id))
    } else {
        await db.insert(creditsClaimed).values({ returnId, type: "ctc", qualifyingCount: safe })
    }
    return true
}
