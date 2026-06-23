"use server"

import { getCurrentUser } from "@/lib/server/auth"
import { createReturn } from "@/lib/server/returns"

export type CreateReturnResult =
    | { ok: true; returnId: string }
    | { ok: false; error: string }

export async function createReturnAction(taxYear: number): Promise<CreateReturnResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }
    if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) {
        return { ok: false, error: "Invalid tax year." }
    }
    try {
        const ret = await createReturn(user.id, taxYear)
        return { ok: true, returnId: ret.id }
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Could not create return." }
    }
}
