"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { CONSENT_ITEMS } from "@/lib/filing-shared"
import { acceptConsentsAction, reopenAction, signAction, submitAction } from "./actions"

export function ReopenButton({ returnId }: { returnId: string }) {
    const router = useRouter()
    const [error, setError] = React.useState<string | null>(null)
    const [pending, start] = React.useTransition()

    const reopen = () => {
        setError(null)
        start(async () => {
            const result = await reopenAction(returnId)
            if (!result.ok) setError(result.error)
            else router.push(`/file/${returnId}/interview`)
        })
    }

    return (
        <div className="flex flex-col gap-stack-sm items-start">
            <button
                onClick={reopen}
                disabled={pending}
                className="inline-flex items-center gap-stack-sm self-start px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                <MaterialIcon name="edit" size={16} />
                {pending ? "Reopening…" : "Fix & resubmit"}
            </button>
            {error && <p className="font-body-md text-body-md text-error">{error}</p>}
        </div>
    )
}

export function ConsentStep({ returnId }: { returnId: string }) {
    const router = useRouter()
    const [checked, setChecked] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [pending, start] = React.useTransition()

    const accept = () => {
        setError(null)
        start(async () => {
            const result = await acceptConsentsAction(returnId)
            if (!result.ok) setError(result.error)
            else router.refresh()
        })
    }

    return (
        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
            <h2 className="font-headline-md text-headline-md text-primary">Consent</h2>
            <div className="flex flex-col gap-stack-md">
                {CONSENT_ITEMS.map((c) => (
                    <div key={c.type} className="flex flex-col gap-1">
                        <p className="font-body-md text-body-md text-on-surface font-medium">{c.label}</p>
                        <p className="font-body-md text-body-md text-on-surface-variant">{c.body}</p>
                    </div>
                ))}
            </div>
            <label className="flex items-center gap-stack-md font-body-md text-body-md text-on-surface cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    className="rounded"
                />
                I have read and agree to all of the above.
            </label>
            <button
                onClick={accept}
                disabled={pending || !checked}
                className="inline-flex items-center gap-stack-sm self-start px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-40"
            >
                {pending ? "Saving…" : "Agree & continue"}
                <MaterialIcon name="arrow_forward" size={16} />
            </button>
            {error && <p className="font-body-md text-body-md text-error">{error}</p>}
        </div>
    )
}

export function SignStep({ returnId }: { returnId: string }) {
    const router = useRouter()
    const [priorYearAgi, setPriorYearAgi] = React.useState("")
    const [ipPin, setIpPin] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [pending, start] = React.useTransition()

    const sign = () => {
        setError(null)
        start(async () => {
            const result = await signAction(returnId, { priorYearAgi, ipPin: ipPin || undefined })
            if (!result.ok) setError(result.error)
            else router.refresh()
        })
    }

    return (
        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
            <div>
                <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                    Verify &amp; sign
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                    The IRS verifies your identity with last year&apos;s AGI. Your entries are used to
                    sign and are never stored on our servers.
                </p>
            </div>
            <div className="flex flex-col gap-stack-md max-w-md">
                <div className="flex flex-col gap-stack-sm">
                    <label className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                        2023 adjusted gross income
                    </label>
                    <input
                        inputMode="numeric"
                        placeholder="$0"
                        value={priorYearAgi}
                        onChange={(e) => setPriorYearAgi(e.target.value)}
                        className="rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                    />
                </div>
                <div className="flex flex-col gap-stack-sm">
                    <label className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                        IP PIN (optional, 6 digits)
                    </label>
                    <input
                        inputMode="numeric"
                        placeholder="123456"
                        value={ipPin}
                        onChange={(e) => setIpPin(e.target.value)}
                        className="rounded-lg border border-outline-variant/40 bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                    />
                </div>
            </div>
            <button
                onClick={sign}
                disabled={pending}
                className="inline-flex items-center gap-stack-sm self-start px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                <MaterialIcon name="draw" size={16} />
                {pending ? "Signing…" : "Sign my return"}
            </button>
            {error && <p className="font-body-md text-body-md text-error">{error}</p>}
        </div>
    )
}

export function SubmitStep({ returnId }: { returnId: string }) {
    const router = useRouter()
    const [error, setError] = React.useState<string | null>(null)
    const [pending, start] = React.useTransition()

    const submit = () => {
        setError(null)
        start(async () => {
            const result = await submitAction(returnId)
            if (!result.ok) setError(result.error)
            else router.refresh()
        })
    }

    return (
        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
            <div>
                <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                    File your return
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                    We&apos;ll run a final check and transmit your federal return to the IRS through
                    our authorized transmitter.
                </p>
            </div>
            <button
                onClick={submit}
                disabled={pending}
                className="inline-flex items-center gap-stack-sm self-start px-8 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                <MaterialIcon name="send" size={16} />
                {pending ? "Transmitting…" : "File my federal return"}
            </button>
            {error && <p className="font-body-md text-body-md text-error">{error}</p>}
        </div>
    )
}
