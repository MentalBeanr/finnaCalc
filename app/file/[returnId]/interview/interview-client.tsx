"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { FILING_STATUS_OPTIONS, formatCents } from "@/lib/returns-shared"
import { INCOME_TYPE_OPTIONS, incomeTypeLabel } from "@/lib/interview-shared"
import {
    addIncomeAction,
    removeIncomeAction,
    setChildrenAction,
    setFilingStatusAction,
} from "./actions"

export interface IncomeRow {
    id: string
    type: string
    amountCents: number
    withholdingCents: number
}

export interface EstimateView {
    agiCents: number
    taxableIncomeCents: number
    taxAfterCreditsCents: number
    withholdingCents: number
    refundOrDueCents: number
    marginalRateBp: number
}

export interface InterviewProps {
    returnId: string
    filingStatus: string | null
    income: IncomeRow[]
    numChildren: number
    estimate: EstimateView | null
}

export function InterviewClient(props: InterviewProps) {
    const router = useRouter()
    const [error, setError] = React.useState<string | null>(null)
    const [pending, startTransition] = React.useTransition()

    const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
        setError(null)
        startTransition(async () => {
            const result = await fn()
            if (!result.ok) setError(result.error ?? "Something went wrong.")
            else router.refresh()
        })
    }

    return (
        <div className="grid grid-cols-3 gap-gutter items-start">
            {/* Main column */}
            <div className="col-span-2 flex flex-col gap-gutter">
                {/* Filing status */}
                <section className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-md">
                    <h2 className="font-headline-md text-headline-md text-primary">About you</h2>
                    <div className="flex flex-col gap-stack-sm max-w-md">
                        <label className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                            Filing status
                        </label>
                        <select
                            value={props.filingStatus ?? ""}
                            disabled={pending}
                            onChange={(e) => run(() => setFilingStatusAction(props.returnId, e.target.value))}
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
                </section>

                {/* Income */}
                <section className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                    <div>
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                            Income
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Add each source of income. Your estimate updates as you go.
                        </p>
                    </div>

                    {props.income.length > 0 && (
                        <div className="flex flex-col divide-y divide-outline-variant/20">
                            {props.income.map((row) => (
                                <div key={row.id} className="flex items-center justify-between py-stack-md">
                                    <div>
                                        <p className="font-body-md text-body-md text-on-surface">
                                            {incomeTypeLabel(row.type)}
                                        </p>
                                        <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                            {formatCents(row.amountCents)}
                                            {row.withholdingCents > 0
                                                ? ` · ${formatCents(row.withholdingCents)} withheld`
                                                : ""}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => run(() => removeIncomeAction(props.returnId, row.id))}
                                        disabled={pending}
                                        aria-label="Remove"
                                        className="p-2 rounded-lg text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
                                    >
                                        <MaterialIcon name="delete" size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <AddIncomeForm
                        disabled={pending}
                        onAdd={(input) => run(() => addIncomeAction(props.returnId, input))}
                    />
                </section>

                {/* Dependents */}
                <section className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-md">
                    <div>
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                            Dependents
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Qualifying children under 17 (for the Child Tax Credit).
                        </p>
                    </div>
                    <ChildrenInput
                        value={props.numChildren}
                        disabled={pending}
                        onChange={(n) => run(() => setChildrenAction(props.returnId, n))}
                    />
                </section>

                {error && <p className="font-body-md text-body-md text-error">{error}</p>}
            </div>

            {/* Estimate rail */}
            <aside className="col-span-1 sticky top-24 flex flex-col gap-gutter">
                <EstimatePanel estimate={props.estimate} hasFilingStatus={Boolean(props.filingStatus)} />
                {props.estimate && (
                    <Link
                        href={`/file/${props.returnId}/review`}
                        className="inline-flex items-center justify-center gap-stack-sm px-6 py-3 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity"
                    >
                        Review my return
                        <MaterialIcon name="arrow_forward" size={16} />
                    </Link>
                )}
            </aside>
        </div>
    )
}

function AddIncomeForm({
    disabled,
    onAdd,
}: {
    disabled: boolean
    onAdd: (input: { type: string; amount: string; withholding?: string }) => void
}) {
    const [type, setType] = React.useState<string>(INCOME_TYPE_OPTIONS[0].value)
    const [amount, setAmount] = React.useState("")
    const [withholding, setWithholding] = React.useState("")

    const submit = () => {
        if (!amount.trim()) return
        onAdd({ type, amount, withholding: withholding || undefined })
        setAmount("")
        setWithholding("")
    }

    return (
        <div className="flex flex-col gap-stack-md border-t border-outline-variant/20 pt-stack-lg">
            <div className="grid grid-cols-3 gap-stack-md">
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                >
                    {INCOME_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <input
                    inputMode="decimal"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                />
                <input
                    inputMode="decimal"
                    placeholder="Withheld (optional)"
                    value={withholding}
                    onChange={(e) => setWithholding(e.target.value)}
                    className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                />
            </div>
            <button
                onClick={submit}
                disabled={disabled || !amount.trim()}
                className="inline-flex items-center gap-stack-sm self-start px-5 py-2.5 rounded-full border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
            >
                <MaterialIcon name="add" size={16} />
                Add income
            </button>
        </div>
    )
}

function ChildrenInput({
    value,
    disabled,
    onChange,
}: {
    value: number
    disabled: boolean
    onChange: (n: number) => void
}) {
    return (
        <div className="flex items-center gap-stack-md">
            <button
                onClick={() => onChange(Math.max(0, value - 1))}
                disabled={disabled || value <= 0}
                aria-label="Decrease"
                className="p-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
            >
                <MaterialIcon name="remove" size={18} />
            </button>
            <span className="font-headline-md text-[28px] leading-none text-primary w-10 text-center">
                {value}
            </span>
            <button
                onClick={() => onChange(value + 1)}
                disabled={disabled}
                aria-label="Increase"
                className="p-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
            >
                <MaterialIcon name="add" size={18} />
            </button>
        </div>
    )
}

function EstimatePanel({
    estimate,
    hasFilingStatus,
}: {
    estimate: EstimateView | null
    hasFilingStatus: boolean
}) {
    return (
        <div className="border border-outline-variant/30 rounded-lg bg-surface-container p-8 flex flex-col gap-stack-lg">
            <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                Estimated {estimate && estimate.refundOrDueCents < 0 ? "amount owed" : "refund"}
            </p>
            {!hasFilingStatus || !estimate ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                    Select a filing status to see your estimate.
                </p>
            ) : (
                <>
                    <p
                        className={`font-headline-display text-[44px] leading-none ${
                            estimate.refundOrDueCents < 0 ? "text-error" : "text-success"
                        }`}
                    >
                        {formatCents(Math.abs(estimate.refundOrDueCents))}
                    </p>
                    <div className="flex flex-col divide-y divide-outline-variant/20">
                        <EstimateRow label="AGI" value={formatCents(estimate.agiCents)} />
                        <EstimateRow
                            label="Taxable income"
                            value={formatCents(estimate.taxableIncomeCents)}
                        />
                        <EstimateRow label="Tax" value={formatCents(estimate.taxAfterCreditsCents)} />
                        <EstimateRow label="Withheld" value={formatCents(estimate.withholdingCents)} />
                        <EstimateRow
                            label="Marginal rate"
                            value={`${(estimate.marginalRateBp / 100).toFixed(0)}%`}
                        />
                    </div>
                    <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                        Estimate only · standard deduction · federal
                    </p>
                </>
            )}
        </div>
    )
}

function EstimateRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-stack-sm">
            <span className="font-body-md text-body-md text-on-surface-variant">{label}</span>
            <span className="font-body-md text-body-md text-on-surface">{value}</span>
        </div>
    )
}
