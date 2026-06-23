"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { createReturnAction } from "./actions"

export function NewReturn({ years }: { years: number[] }) {
    const router = useRouter()
    const [year, setYear] = React.useState<number>(years[0])
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const start = async () => {
        setBusy(true)
        setError(null)
        const result = await createReturnAction(year)
        if (!result.ok) {
            setBusy(false)
            setError(result.error)
            return
        }
        router.push(`/file/${result.returnId}`)
    }

    return (
        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
            <div>
                <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                    Start a new return
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                    Choose a tax year to begin. You can save and come back anytime.
                </p>
            </div>
            <div className="flex items-center gap-stack-md">
                <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                >
                    {years.map((y) => (
                        <option key={y} value={y}>
                            Tax year {y}
                        </option>
                    ))}
                </select>
                <button
                    onClick={start}
                    disabled={busy}
                    className="inline-flex items-center gap-stack-sm px-6 py-2.5 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    <MaterialIcon name="add" size={16} />
                    {busy ? "Creating…" : "Start return"}
                </button>
            </div>
            {error && <p className="font-body-md text-body-md text-error">{error}</p>}
        </div>
    )
}
