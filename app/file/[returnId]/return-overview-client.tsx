"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { FILING_STATUS_OPTIONS, US_STATES } from "@/lib/returns-shared"
import { deleteReturnAction, transitionAction, updateBasicsAction } from "./actions"

export interface OverviewProps {
    returnId: string
    state: string
    filingStatus: string | null
    stateOfResidence: string | null
    canDelete: boolean
    /** The forward lifecycle action available, if any. */
    nextAction: { toState: string; label: string } | null
    basicsComplete: boolean
}

export function ReturnOverviewClient(props: OverviewProps) {
    const router = useRouter()
    const [filingStatus, setFilingStatus] = React.useState(props.filingStatus ?? "")
    const [stateOfResidence, setStateOfResidence] = React.useState(props.stateOfResidence ?? "")
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [saved, setSaved] = React.useState(false)

    const dirty =
        filingStatus !== (props.filingStatus ?? "") ||
        stateOfResidence !== (props.stateOfResidence ?? "")

    const saveBasics = async () => {
        setBusy(true)
        setError(null)
        setSaved(false)
        const result = await updateBasicsAction(props.returnId, {
            filingStatus: filingStatus || undefined,
            stateOfResidence: stateOfResidence || undefined,
        })
        setBusy(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        setSaved(true)
        router.refresh()
    }

    const runTransition = async (toState: string) => {
        setBusy(true)
        setError(null)
        const result = await transitionAction(props.returnId, toState)
        setBusy(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        router.refresh()
    }

    const remove = async () => {
        setBusy(true)
        setError(null)
        const result = await deleteReturnAction(props.returnId)
        if (!result.ok) {
            setBusy(false)
            setError(result.error)
            return
        }
        router.push("/file")
    }

    return (
        <div className="flex flex-col gap-gutter">
            {/* Basics */}
            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                <h2 className="font-headline-md text-headline-md text-primary">Return details</h2>
                <div className="grid grid-cols-2 gap-gutter">
                    <div className="flex flex-col gap-stack-sm">
                        <label className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                            Filing status
                        </label>
                        <select
                            value={filingStatus}
                            onChange={(e) => setFilingStatus(e.target.value)}
                            className="rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                        >
                            <option value="">Select…</option>
                            {FILING_STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-stack-sm">
                        <label className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                            State of residence
                        </label>
                        <select
                            value={stateOfResidence}
                            onChange={(e) => setStateOfResidence(e.target.value)}
                            className="rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                        >
                            <option value="">Select…</option>
                            {US_STATES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-stack-md">
                    <button
                        onClick={saveBasics}
                        disabled={busy || !dirty}
                        className="inline-flex items-center gap-stack-sm px-5 py-2.5 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                        {busy ? "Saving…" : "Save details"}
                    </button>
                    {saved && !dirty && (
                        <span className="inline-flex items-center gap-1 font-body-md text-body-md text-success">
                            <MaterialIcon name="check" size={16} /> Saved
                        </span>
                    )}
                </div>
            </div>

            {/* Lifecycle */}
            {props.nextAction && (
                <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-8 flex items-center justify-between">
                    <div>
                        <p className="font-body-md text-body-md text-on-surface font-semibold">
                            {props.nextAction.label}
                        </p>
                        {!props.basicsComplete && props.nextAction.toState === "ready_to_review" && (
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                Set your filing status and state of residence first.
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => runTransition(props.nextAction!.toState)}
                        disabled={
                            busy ||
                            (props.nextAction.toState === "ready_to_review" && !props.basicsComplete)
                        }
                        className="inline-flex items-center gap-stack-sm px-5 py-2.5 rounded-full border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
                    >
                        {props.nextAction.label}
                        <MaterialIcon name="arrow_forward" size={16} />
                    </button>
                </div>
            )}

            {error && <p className="font-body-md text-body-md text-error">{error}</p>}

            {/* Danger zone */}
            {props.canDelete && (
                <div className="flex items-center justify-between pt-stack-md">
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        Delete this return and all its data.
                    </p>
                    <button
                        onClick={remove}
                        disabled={busy}
                        className="inline-flex items-center gap-stack-sm px-5 py-2.5 rounded-full border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-error/40 hover:text-error transition-colors disabled:opacity-50"
                    >
                        <MaterialIcon name="delete" size={16} />
                        Delete return
                    </button>
                </div>
            )}
        </div>
    )
}
