"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/server/auth"
import { addIncome, removeIncome, setQualifyingChildren } from "@/lib/server/return-inputs"
import { updateReturnBasics } from "@/lib/server/returns"
import { isInterviewIncomeType, parseDollarsToCents } from "@/lib/interview-shared"
import { isFilingStatus } from "@/lib/returns-shared"

export type ActionResult = { ok: true } | { ok: false; error: string }

function revalidate(returnId: string) {
    revalidatePath(`/file/${returnId}/interview`)
}

export async function setFilingStatusAction(returnId: string, status: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    if (!isFilingStatus(status)) return { ok: false, error: "Invalid filing status." }
    const row = await updateReturnBasics(user.id, returnId, { filingStatus: status })
    if (!row) return { ok: false, error: "Return not found." }
    revalidate(returnId)
    return { ok: true }
}

export async function addIncomeAction(
    returnId: string,
    input: { type: string; amount: string; withholding?: string },
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    if (!isInterviewIncomeType(input.type)) return { ok: false, error: "Unknown income type." }

    const amountCents = parseDollarsToCents(input.amount)
    if (amountCents === null) return { ok: false, error: "Enter a valid amount." }

    let withholdingCents = 0
    if (input.withholding && input.withholding.trim() !== "") {
        const parsed = parseDollarsToCents(input.withholding)
        if (parsed === null) return { ok: false, error: "Enter a valid withholding amount." }
        withholdingCents = parsed
    }

    const row = await addIncome(user.id, returnId, { type: input.type, amountCents, withholdingCents })
    if (!row) return { ok: false, error: "Return not found." }
    revalidate(returnId)
    return { ok: true }
}

export async function removeIncomeAction(returnId: string, incomeId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    const ok = await removeIncome(user.id, returnId, incomeId)
    if (!ok) return { ok: false, error: "Return not found." }
    revalidate(returnId)
    return { ok: true }
}

export async function setChildrenAction(returnId: string, count: number): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    const ok = await setQualifyingChildren(user.id, returnId, count)
    if (!ok) return { ok: false, error: "Return not found." }
    revalidate(returnId)
    return { ok: true }
}
