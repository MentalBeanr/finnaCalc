"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/server/auth"
import { recordConsents, recordSignature, submitFederalReturn } from "@/lib/server/filing"
import { validateSignatureInput } from "@/lib/filing-shared"

export type ActionResult = { ok: true } | { ok: false; error: string }

function revalidate(returnId: string) {
    revalidatePath(`/file/${returnId}/file`)
    revalidatePath(`/file/${returnId}`)
}

export async function acceptConsentsAction(returnId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    const ok = await recordConsents(user.id, returnId)
    if (!ok) return { ok: false, error: "Return not found." }
    revalidate(returnId)
    return { ok: true }
}

export async function signAction(
    returnId: string,
    input: { priorYearAgi: string; ipPin?: string },
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }

    const valid = validateSignatureInput(input)
    if (!valid.ok) return valid

    // In stub mode the prior-year AGI format check stands in for IRS verification.
    const result = await recordSignature(user.id, returnId, {
        priorYearAgiMatch: true,
        ipPinPresent: Boolean(input.ipPin && input.ipPin.trim() !== ""),
    })
    if (!result.ok) return result
    revalidate(returnId)
    return { ok: true }
}

export async function submitAction(returnId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    const result = await submitFederalReturn(user.id, returnId)
    if (!result.ok) return result
    revalidate(returnId)
    return { ok: true }
}
