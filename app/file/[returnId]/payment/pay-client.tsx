"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { payFilingFeeAction } from "./actions"

export function PayButton({ returnId, label }: { returnId: string; label: string }) {
    const router = useRouter()
    const [error, setError] = React.useState<string | null>(null)
    const [pending, startTransition] = React.useTransition()

    const pay = () => {
        setError(null)
        startTransition(async () => {
            const result = await payFilingFeeAction(returnId)
            if (!result.ok) setError(result.error)
            else router.refresh()
        })
    }

    return (
        <div className="flex flex-col gap-stack-sm">
            <button
                onClick={pay}
                disabled={pending}
                className="inline-flex items-center gap-stack-sm self-start px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                <MaterialIcon name="lock" size={16} />
                {pending ? "Processing…" : label}
            </button>
            {error && <p className="font-body-md text-body-md text-error">{error}</p>}
        </div>
    )
}
