"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { saveAndAdvanceAction } from "./actions"

export function ReviewActions({
    returnId,
    canAdvance,
    alreadyReadyToFile,
}: {
    returnId: string
    canAdvance: boolean
    alreadyReadyToFile: boolean
}) {
    const router = useRouter()
    const [error, setError] = React.useState<string | null>(null)
    const [pending, startTransition] = React.useTransition()

    const advance = () => {
        setError(null)
        startTransition(async () => {
            const result = await saveAndAdvanceAction(returnId)
            if (!result.ok) setError(result.error)
            else router.refresh()
        })
    }

    if (alreadyReadyToFile) {
        return (
            <div className="flex items-center gap-stack-sm font-body-md text-body-md text-success">
                <MaterialIcon name="check_circle" size={20} />
                Saved and ready to file.
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-stack-sm">
            <button
                onClick={advance}
                disabled={pending || !canAdvance}
                className="inline-flex items-center gap-stack-sm self-start px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-40"
            >
                {pending ? "Saving…" : "Save & mark ready to file"}
                <MaterialIcon name="arrow_forward" size={16} />
            </button>
            {error && <p className="font-body-md text-body-md text-error">{error}</p>}
        </div>
    )
}
