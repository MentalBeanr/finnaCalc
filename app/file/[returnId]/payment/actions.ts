"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/server/auth"
import { createFilingFeePayment } from "@/lib/server/payments"
import { priceReturn } from "@/lib/pricing-shared"

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function payFilingFeeAction(returnId: string): Promise<ActionResult> {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: "You must be signed in." }

    const { totalCents } = priceReturn({})
    if (totalCents <= 0) return { ok: true } // nothing to charge

    const payment = await createFilingFeePayment(user.id, returnId, totalCents)
    if (!payment) return { ok: false, error: "Could not process payment." }
    if (payment.status !== "captured") return { ok: false, error: "Payment did not go through." }

    revalidatePath(`/file/${returnId}/payment`)
    return { ok: true }
}
