"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/server/auth"
import { deleteReturn, transitionReturn, updateReturnBasics } from "@/lib/server/returns"
import {
    isFilingStatus,
    type FilingStatusValue,
    type ReturnBasicsInput,
} from "@/lib/returns-shared"

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function updateBasicsAction(
    returnId: string,
    input: ReturnBasicsInput,
): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }

    const basics: { filingStatus?: FilingStatusValue; stateOfResidence?: string } = {}
    if (input.filingStatus && isFilingStatus(input.filingStatus)) {
        basics.filingStatus = input.filingStatus
    }
    if (input.stateOfResidence) basics.stateOfResidence = input.stateOfResidence

    const row = await updateReturnBasics(user.id, returnId, basics)
    if (!row) return { ok: false, error: "Return not found." }
    revalidatePath(`/file/${returnId}`)
    return { ok: true }
}

export async function transitionAction(returnId: string, toState: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    try {
        await transitionReturn(user.id, returnId, toState)
        revalidatePath(`/file/${returnId}`)
        return { ok: true }
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Transition failed." }
    }
}

export async function deleteReturnAction(returnId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    const removed = await deleteReturn(user.id, returnId)
    if (!removed) return { ok: false, error: "Only draft returns can be deleted." }
    revalidatePath("/file")
    return { ok: true }
}
