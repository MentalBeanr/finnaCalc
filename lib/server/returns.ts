/**
 * Tax return service: the domain operations on the returns model.
 *
 * Server-only, user-scoped: a caller can only ever touch their own returns. This
 * is the return *model* (database-design.md §5, §16) — the tax engine
 * (tax-engine-specification.md) and the guided interview are separate layers
 * built on top of it.
 */
import { and, desc, eq, sql } from "drizzle-orm"
import { getDb } from "@/db/client"
import {
    taxReturns,
    incomeSources,
    deductionsClaimed,
    creditsClaimed,
    type TaxReturn,
} from "@/db/schema"
import { canTransition, canDelete, type FilingStatusValue } from "@/lib/returns-shared"

/** Create the original return for a user + tax year, or return the existing one. */
export async function createReturn(userId: string, taxYear: number): Promise<TaxReturn> {
    const db = getDb()
    const existing = await db
        .select()
        .from(taxReturns)
        .where(
            and(
                eq(taxReturns.userId, userId),
                eq(taxReturns.taxYear, taxYear),
                eq(taxReturns.kind, "original"),
            ),
        )
        .limit(1)
    if (existing[0]) return existing[0]

    const [row] = await db
        .insert(taxReturns)
        .values({ userId, taxYear, kind: "original", state: "draft" })
        .returning()
    return row
}

/** All of a user's returns, newest tax year first. */
export async function listReturns(userId: string): Promise<TaxReturn[]> {
    const db = getDb()
    return db
        .select()
        .from(taxReturns)
        .where(eq(taxReturns.userId, userId))
        .orderBy(desc(taxReturns.taxYear), desc(taxReturns.createdAt))
}

/** A single return scoped to its owner, or null. */
export async function getReturn(userId: string, returnId: string): Promise<TaxReturn | null> {
    const db = getDb()
    const [row] = await db
        .select()
        .from(taxReturns)
        .where(and(eq(taxReturns.id, returnId), eq(taxReturns.userId, userId)))
        .limit(1)
    return row ?? null
}

export interface ReturnBasics {
    filingStatus?: FilingStatusValue
    stateOfResidence?: string
}

/** Update filing status and/or state of residence on a draft-stage return. */
export async function updateReturnBasics(
    userId: string,
    returnId: string,
    basics: ReturnBasics,
): Promise<TaxReturn | null> {
    const db = getDb()
    const [row] = await db
        .update(taxReturns)
        .set({
            ...(basics.filingStatus ? { filingStatus: basics.filingStatus } : {}),
            ...(basics.stateOfResidence ? { stateOfResidence: basics.stateOfResidence } : {}),
            updatedAt: new Date(),
        })
        .where(and(eq(taxReturns.id, returnId), eq(taxReturns.userId, userId)))
        .returning()
    return row ?? null
}

/** Advance the return state machine, validating the transition is allowed. */
export async function transitionReturn(
    userId: string,
    returnId: string,
    toState: string,
): Promise<TaxReturn> {
    const current = await getReturn(userId, returnId)
    if (!current) throw new Error("Return not found.")
    if (!canTransition(current.state, toState)) {
        throw new Error(`Cannot move a ${current.state} return to ${toState}.`)
    }
    const db = getDb()
    const [row] = await db
        .update(taxReturns)
        .set({
            state: toState as TaxReturn["state"],
            updatedAt: new Date(),
            ...(toState === "submitted" ? { submittedAt: new Date() } : {}),
            ...(toState === "accepted" ? { acceptedAt: new Date() } : {}),
        })
        .where(and(eq(taxReturns.id, returnId), eq(taxReturns.userId, userId)))
        .returning()
    return row
}

/** Delete a draft/rejected return owned by the user. Returns false otherwise. */
export async function deleteReturn(userId: string, returnId: string): Promise<boolean> {
    const current = await getReturn(userId, returnId)
    if (!current || !canDelete(current.state)) return false
    const db = getDb()
    await db.delete(taxReturns).where(and(eq(taxReturns.id, returnId), eq(taxReturns.userId, userId)))
    return true
}

export interface ReturnSummary {
    incomeCount: number
    incomeTotalCents: number
    deductionCount: number
    deductionTotalCents: number
    creditCount: number
}

/** Aggregate counts/totals of the return's user-asserted inputs. */
export async function getReturnSummary(returnId: string): Promise<ReturnSummary> {
    const db = getDb()
    const [income] = await db
        .select({
            count: sql<number>`count(*)::int`,
            total: sql<number>`coalesce(sum(${incomeSources.amountCents}), 0)::bigint`,
        })
        .from(incomeSources)
        .where(eq(incomeSources.returnId, returnId))
    const [deductions] = await db
        .select({
            count: sql<number>`count(*)::int`,
            total: sql<number>`coalesce(sum(${deductionsClaimed.amountCents}), 0)::bigint`,
        })
        .from(deductionsClaimed)
        .where(eq(deductionsClaimed.returnId, returnId))
    const [credits] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(creditsClaimed)
        .where(eq(creditsClaimed.returnId, returnId))

    return {
        incomeCount: Number(income?.count ?? 0),
        incomeTotalCents: Number(income?.total ?? 0),
        deductionCount: Number(deductions?.count ?? 0),
        deductionTotalCents: Number(deductions?.total ?? 0),
        creditCount: Number(credits?.count ?? 0),
    }
}
