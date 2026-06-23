"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/server/auth"
import { buildFederalInputForReturn, runCalculation } from "@/lib/server/federal-support"
import { getReturn, transitionReturn } from "@/lib/server/returns"
import { federalReviewDiagnostics } from "@/lib/federal-support-shared"

export type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Validate, persist a calculation snapshot, and advance the return to
 * "ready to file" (walking draft → ready_to_review → ready_to_file).
 */
export async function saveAndAdvanceAction(returnId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }

    const built = await buildFederalInputForReturn(user.id, returnId)
    if (!built) return { ok: false, error: "Return not found." }

    const diagnostics = federalReviewDiagnostics({
        filingStatus: built.ret.filingStatus,
        incomeCount: built.incomeCount,
    })
    if (diagnostics.some((d) => d.severity === "error")) {
        return { ok: false, error: "Resolve the issues above before continuing." }
    }

    await runCalculation(user.id, returnId)

    const current = await getReturn(user.id, returnId)
    if (current?.state === "draft") {
        await transitionReturn(user.id, returnId, "ready_to_review")
    }
    const afterReview = await getReturn(user.id, returnId)
    if (afterReview?.state === "ready_to_review") {
        await transitionReturn(user.id, returnId, "ready_to_file")
    }

    revalidatePath(`/file/${returnId}`)
    revalidatePath(`/file/${returnId}/review`)
    return { ok: true }
}
