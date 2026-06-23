"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "@/components/ds/material-icon"
import { FILING_STATUS_OPTIONS, formatCents } from "@/lib/returns-shared"
import {
    DEDUCTION_TYPE_OPTIONS,
    INCOME_TYPE_OPTIONS,
    deductionTypeLabel,
    incomeTypeLabel,
} from "@/lib/interview-shared"
import type { IncomeSuggestion } from "@/lib/extraction-shared"
import {
    addDeductionAction,
    addIncomeAction,
    extractFromDocumentAction,
    removeDeductionAction,
    removeIncomeAction,
    setChildrenAction,
    setFilingStatusAction,
} from "./actions"

export interface IncomeRow {
    id: string
    type: string
    amountCents: number
    withholdingCents: number
    metadata: Record<string, unknown>
}

export interface DeductionRow {
    id: string
    type: string
    amountCents: number
}

export interface EstimateView {
    agiCents: number
    taxableIncomeCents: number
    taxBeforeCreditsCents: number
    taxAfterCreditsCents: number
    selfEmploymentTaxCents: number
    earnedIncomeCreditCents: number
    usingItemizedDeduction: boolean
    withholdingCents: number
    refundOrDueCents: number
    marginalRateBp: number
}

export interface InterviewProps {
    returnId: string
    filingStatus: string | null
    income: IncomeRow[]
    deductions: DeductionRow[]
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
                                            {formatCents(Math.abs(row.amountCents))}
                                            {row.amountCents < 0 ? " loss" : ""}
                                            {row.withholdingCents > 0
                                                ? ` · ${formatCents(row.withholdingCents)} withheld`
                                                : ""}
                                            {row.type === "1099_div" &&
                                            typeof row.metadata?.qualifiedCents === "number" &&
                                            row.metadata.qualifiedCents > 0
                                                ? ` · ${formatCents(row.metadata.qualifiedCents as number)} qualified`
                                                : ""}
                                            {row.type === "1099_b" && row.metadata?.term
                                                ? ` · ${row.metadata.term === "short" ? "short-term" : "long-term"}`
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

                    <ExtractSection returnId={props.returnId} />

                    <AddIncomeForm
                        disabled={pending}
                        onAdd={(input) => run(() => addIncomeAction(props.returnId, input))}
                    />
                </section>

                {/* Deductions */}
                <section className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
                    <div>
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                            Deductions
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Add itemized deductions if they exceed your standard deduction. We'll
                            automatically use whichever is larger.
                        </p>
                    </div>

                    {props.deductions.length > 0 && (
                        <div className="flex flex-col divide-y divide-outline-variant/20">
                            {props.deductions.map((row) => (
                                <div key={row.id} className="flex items-center justify-between py-stack-md">
                                    <div>
                                        <p className="font-body-md text-body-md text-on-surface">
                                            {deductionTypeLabel(row.type)}
                                        </p>
                                        <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                                            {formatCents(row.amountCents)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            run(() => removeDeductionAction(props.returnId, row.id))
                                        }
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

                    <AddDeductionForm
                        disabled={pending}
                        onAdd={(input) => run(() => addDeductionAction(props.returnId, input))}
                    />
                </section>

                {/* Dependents */}
                <section className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-md">
                    <div>
                        <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                            Dependents
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Qualifying children under 17 (for the Child Tax Credit and EITC).
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

function ExtractSection({ returnId }: { returnId: string }) {
    const router = useRouter()
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [suggestions, setSuggestions] = React.useState<IncomeSuggestion[]>([])
    const [busy, setBusy] = React.useState(false)
    const [message, setMessage] = React.useState<string | null>(null)

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        setBusy(true)
        setMessage(null)
        setSuggestions([])
        const fd = new FormData()
        fd.set("file", file)
        const result = await extractFromDocumentAction(returnId, fd)
        setBusy(false)
        if (!result.ok) {
            setMessage(result.error)
            return
        }
        if (result.suggestions.length === 0) {
            setMessage("No income fields detected. Enter them manually below.")
            return
        }
        setSuggestions(result.suggestions)
    }

    const confirm = async (s: IncomeSuggestion) => {
        setBusy(true)
        await addIncomeAction(returnId, {
            type: s.type,
            amount: String(s.amountCents / 100),
            withholding: s.withholdingCents ? String(s.withholdingCents / 100) : undefined,
        })
        setSuggestions((prev) => prev.filter((x) => x !== s))
        setBusy(false)
        router.refresh()
    }

    return (
        <div className="border border-outline-variant/20 rounded-lg p-6 flex flex-col gap-stack-md">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-stack-sm">
                    <MaterialIcon name="auto_awesome" size={18} className="text-primary" />
                    <p className="font-body-md text-body-md text-on-surface font-medium">
                        Auto-fill from a photo
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFile}
                    disabled={busy}
                />
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                    className="inline-flex items-center gap-stack-sm px-4 py-2 rounded-full border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                >
                    <MaterialIcon name="photo_camera" size={16} />
                    {busy ? "Reading…" : "Upload image"}
                </button>
            </div>

            {message && (
                <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
            )}

            {suggestions.length > 0 && (
                <div className="flex flex-col gap-stack-sm">
                    <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                        Detected — confirm to add
                    </p>
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg border border-outline-variant/30"
                        >
                            <span className="font-body-md text-body-md text-on-surface">
                                {s.label} · {formatCents(s.amountCents)}
                                {s.withholdingCents > 0
                                    ? ` · ${formatCents(s.withholdingCents)} withheld`
                                    : ""}
                            </span>
                            <button
                                onClick={() => confirm(s)}
                                disabled={busy}
                                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                <MaterialIcon name="add" size={14} />
                                Add
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                AI suggestions — always review before adding.
            </p>
        </div>
    )
}

function AddIncomeForm({
    disabled,
    onAdd,
}: {
    disabled: boolean
    onAdd: (input: {
        type: string
        amount: string
        withholding?: string
        metadata?: Record<string, unknown>
    }) => void
}) {
    const [type, setType] = React.useState<string>(INCOME_TYPE_OPTIONS[0].value)
    const [amount, setAmount] = React.useState("")
    const [withholding, setWithholding] = React.useState("")
    // 1099-DIV extra field
    const [qualifiedDivs, setQualifiedDivs] = React.useState("")
    // 1099-B extra field
    const [capGainTerm, setCapGainTerm] = React.useState<"long" | "short">("long")

    const isDiv = type === "1099_div"
    const isCapGain = type === "1099_b"

    const submit = () => {
        if (!amount.trim()) return
        const metadata: Record<string, unknown> = {}
        if (isDiv && qualifiedDivs.trim()) {
            const qCents = Math.round(Number(qualifiedDivs.replace(/[$,\s]/g, "")) * 100)
            if (Number.isFinite(qCents) && qCents >= 0) metadata.qualifiedCents = qCents
        }
        if (isCapGain) {
            metadata.term = capGainTerm
        }
        onAdd({
            type,
            amount,
            withholding: withholding || undefined,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        })
        setAmount("")
        setWithholding("")
        setQualifiedDivs("")
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
                    placeholder={isCapGain ? "Net gain (+) or loss (−)" : "Amount"}
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

            {/* Extra fields for dividends */}
            {isDiv && (
                <div className="flex flex-col gap-stack-sm">
                    <label className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                        Qualified dividends (box 1b — must be ≤ total above)
                    </label>
                    <input
                        inputMode="decimal"
                        placeholder="Qualified dividend amount"
                        value={qualifiedDivs}
                        onChange={(e) => setQualifiedDivs(e.target.value)}
                        className="max-w-xs rounded-lg border border-outline-variant/40 bg-surface px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                    />
                </div>
            )}

            {/* Extra fields for capital gains */}
            {isCapGain && (
                <div className="flex flex-col gap-stack-sm">
                    <label className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                        Holding period
                    </label>
                    <div className="flex gap-stack-md">
                        {(["long", "short"] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setCapGainTerm(t)}
                                className={`px-4 py-2 rounded-lg border font-body-md text-body-md transition-colors ${
                                    capGainTerm === t
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40"
                                }`}
                            >
                                {t === "long" ? "Long-term (held > 1 year)" : "Short-term (held ≤ 1 year)"}
                            </button>
                        ))}
                    </div>
                    <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                        Enter a negative number for a net loss (e.g. −2500).
                    </p>
                </div>
            )}

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

function AddDeductionForm({
    disabled,
    onAdd,
}: {
    disabled: boolean
    onAdd: (input: { type: string; amount: string }) => void
}) {
    const [type, setType] = React.useState<string>(DEDUCTION_TYPE_OPTIONS[0].value)
    const [amount, setAmount] = React.useState("")

    const submit = () => {
        if (!amount.trim()) return
        onAdd({ type, amount })
        setAmount("")
    }

    return (
        <div className="flex flex-col gap-stack-md border-t border-outline-variant/20 pt-stack-lg">
            <div className="grid grid-cols-2 gap-stack-md max-w-lg">
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                >
                    {DEDUCTION_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <input
                    inputMode="decimal"
                    placeholder="Amount paid"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                />
            </div>
            <button
                onClick={submit}
                disabled={disabled || !amount.trim()}
                className="inline-flex items-center gap-stack-sm self-start px-5 py-2.5 rounded-full border border-outline-variant/40 font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
            >
                <MaterialIcon name="add" size={16} />
                Add deduction
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
                            label={estimate.usingItemizedDeduction ? "Itemized deductions" : "Standard deduction"}
                            value={formatCents(estimate.taxableIncomeCents > 0
                                ? estimate.agiCents - estimate.taxableIncomeCents
                                : estimate.agiCents)}
                        />
                        <EstimateRow
                            label="Taxable income"
                            value={formatCents(estimate.taxableIncomeCents)}
                        />
                        <EstimateRow label="Income tax" value={formatCents(estimate.taxBeforeCreditsCents)} />
                        {estimate.selfEmploymentTaxCents > 0 && (
                            <EstimateRow
                                label="Self-employment tax"
                                value={formatCents(estimate.selfEmploymentTaxCents)}
                            />
                        )}
                        {estimate.earnedIncomeCreditCents > 0 && (
                            <EstimateRow
                                label="Earned Income Credit"
                                value={`−${formatCents(estimate.earnedIncomeCreditCents)}`}
                            />
                        )}
                        <EstimateRow label="Tax after credits" value={formatCents(estimate.taxAfterCreditsCents)} />
                        <EstimateRow label="Withheld" value={formatCents(estimate.withholdingCents)} />
                        <EstimateRow
                            label="Marginal rate"
                            value={`${(estimate.marginalRateBp / 100).toFixed(0)}%`}
                        />
                    </div>
                    <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant">
                        Estimate only ·{" "}
                        {estimate.usingItemizedDeduction ? "itemized" : "standard"} deduction · federal
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
