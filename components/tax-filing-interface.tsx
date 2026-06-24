"use client"

import { useState, useMemo, useCallback } from "react"
import { MaterialIcon } from "@/components/ds/material-icon"
import { computeTax } from "@/lib/taxes/tax-engine"
import { TAX_SECTIONS } from "@/lib/taxes/interview-sections"
import { DEFAULT_TAX_DATA, type TaxData } from "@/lib/taxes/types"
import { isDirectFileEligible, STATE_TAXES } from "@/lib/taxes/state-taxes"
import { openTaxSummaryPDF } from "@/lib/taxes/generate-pdf"

interface TaxFilingInterfaceProps { onBack: () => void }

const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const fmtDec = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Standalone field components ──────────────────────────────────────────────

function NumberInput({ id, value, onChange, prefix, suffix, max }: {
    id: string; value: number; onChange: (v: number) => void
    prefix?: string; suffix?: string; max?: number
}) {
    const [raw, setRaw] = useState("")
    const [focused, setFocused] = useState(false)
    return (
        <div className="flex items-center gap-1">
            {prefix && <span className="text-on-surface-variant font-body-md">{prefix}</span>}
            <input
                id={id}
                type="text"
                inputMode="numeric"
                value={focused ? raw : (value === 0 ? "" : value.toLocaleString())}
                placeholder="0"
                onFocus={() => { setRaw(value === 0 ? "" : String(value)); setFocused(true) }}
                onBlur={(e) => {
                    setFocused(false)
                    const cleaned = e.target.value.replace(/[^0-9.-]/g, "")
                    let num = parseFloat(cleaned) || 0
                    if (max !== undefined) num = Math.min(num, max)
                    onChange(num)
                }}
                onChange={(e) => setRaw(e.target.value)}
                className="flex-1 min-w-0 bg-transparent border-b border-outline-variant/40 focus:border-primary outline-none px-1 py-1.5 font-body-md text-body-md text-on-surface text-right transition-colors"
            />
            {suffix && <span className="text-on-surface-variant font-body-md text-sm whitespace-nowrap">{suffix}</span>}
        </div>
    )
}

function BooleanInput({ id, value, onChange }: {
    id: string; value: boolean; onChange: (v: boolean) => void
}) {
    return (
        <div className="flex gap-3">
            {[{ v: true, label: "Yes" }, { v: false, label: "No" }].map(opt => (
                <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => onChange(opt.v)}
                    className={`px-5 py-2 rounded-lg border font-ui-button text-ui-button uppercase tracking-[0.05em] transition-colors text-sm ${
                        value === opt.v
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

function SelectInput({ id, value, onChange, options }: {
    id: string; value: string; onChange: (v: string) => void
    options: { value: string; label: string }[]
}) {
    return (
        <select
            id={id}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full max-w-sm bg-transparent border-b border-outline-variant/40 focus:border-primary outline-none py-1.5 font-body-md text-body-md text-on-surface transition-colors cursor-pointer"
        >
            <option value="" disabled>Select…</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    )
}

function TextInput({ id, value, onChange }: {
    id: string; value: string; onChange: (v: string) => void
}) {
    return (
        <input
            id={id}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full max-w-sm bg-transparent border-b border-outline-variant/40 focus:border-primary outline-none px-1 py-1.5 font-body-md text-body-md text-on-surface transition-colors"
        />
    )
}

// ── Running estimate sidebar ──────────────────────────────────────────────────

function EstimateSidebar({ result }: { result: ReturnType<typeof computeTax> }) {
    const isRefund = !result.owes && Math.abs(result.refundOrOwed) > 0
    const isOwed   = result.owes && Math.abs(result.refundOrOwed) > 0
    const rows: [string, string, string?][] = [
        ["Gross Income",     `$${fmt(result.totalGrossIncome)}`],
        ["AGI",              `$${fmt(result.agi)}`],
        result.usingItemized
            ? ["Itemized Deduction",  `- $${fmt(result.deduction)}`]
            : ["Standard Deduction",  `- $${fmt(result.deduction)}`],
        ...(result.qbiDeduction > 0 ? [["QBI Deduction (20%)", `- $${fmt(result.qbiDeduction)}`] as [string, string]] : []),
        ["Taxable Income",   `$${fmt(result.taxableIncome)}`],
        ["Federal Tax",      `$${fmt(result.totalTaxBeforeCredits)}`],
        ...(result.seTax > 0    ? [["+ SE Tax",          `$${fmt(result.seTax)}`]        as [string, string]] : []),
        ...(result.niit > 0     ? [["+ NIIT (3.8%)",     `$${fmt(result.niit)}`]         as [string, string]] : []),
        ...(result.amt  > 0     ? [["+ AMT",             `$${fmt(result.amt)}`]          as [string, string]] : []),
        ...(result.totalCredits > 0 ? [["Credits",       `- $${fmt(result.totalCredits)}`] as [string, string]] : []),
        ["Tax After Credits", `$${fmt(result.taxAfterCredits)}`],
        ["Total Withheld",   `- $${fmt(result.totalPayments)}`],
    ]
    return (
        <div className="flex flex-col gap-3 sticky top-6">
            <div className={`rounded-xl border-2 p-5 transition-colors ${
                isRefund ? "border-success bg-success/5"
                : isOwed ? "border-error bg-error/5"
                : "border-outline-variant/30 bg-surface-container-lowest"
            }`}>
                <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant mb-1">
                    {isRefund ? "Estimated Federal Refund" : isOwed ? "Estimated Federal Tax Owed" : "Estimated Result"}
                </p>
                <p className={`text-3xl font-black tabular-nums ${isRefund ? "text-success" : isOwed ? "text-error" : "text-on-surface"}`}>
                    ${fmtDec(Math.abs(result.refundOrOwed))}
                </p>
                <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant mt-2">
                    Marginal rate {(result.marginalRate * 100).toFixed(0)}%
                    &nbsp;·&nbsp;Effective {(result.effectiveRate * 100).toFixed(1)}%
                </p>
            </div>

            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 flex flex-col gap-1">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-0.5">
                        <span className="font-body-md text-[12px] text-on-surface-variant">{label}</span>
                        <span className="font-body-md text-[12px] text-on-surface tabular-nums font-medium">{value}</span>
                    </div>
                ))}
            </div>

            {result.stateResult && (
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                    <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant mb-2">
                        {result.stateResult.stateName} State Tax
                    </p>
                    {result.stateResult.noIncomeTax
                        ? <p className="font-body-md text-[12px] text-success">No state income tax — $0</p>
                        : <div className="flex flex-col gap-1">
                            <div className="flex justify-between"><span className="font-body-md text-[12px] text-on-surface-variant">State Tax</span><span className="font-body-md text-[12px] font-medium tabular-nums">${fmt(result.stateResult.stateTax)}</span></div>
                            <div className="flex justify-between"><span className="font-body-md text-[12px] text-on-surface-variant">Effective Rate</span><span className="font-body-md text-[12px] font-medium">{(result.stateResult.effectiveRate * 100).toFixed(2)}%</span></div>
                          </div>
                    }
                </div>
            )}

            <p className="font-label-caps uppercase tracking-[0.15em] text-[10px] text-on-surface-variant text-center">
                Updates live as you answer questions
            </p>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TaxFilingInterface({ onBack }: TaxFilingInterfaceProps) {
    const [data, setData] = useState<TaxData>(DEFAULT_TAX_DATA)
    const [activeSectionId, setActiveSectionId] = useState("personal")
    const [expandedSubsections, setExpandedSubsections] = useState<Record<string, boolean>>({})

    const update = useCallback(<K extends keyof TaxData>(key: K, value: TaxData[K]) => {
        setData(prev => ({ ...prev, [key]: value }))
    }, [])

    const result = useMemo(() => computeTax(data), [data])

    const activeSection = TAX_SECTIONS.find(s => s.id === activeSectionId)

    const toggleSubsection = (key: string) => {
        setExpandedSubsections(prev => ({ ...prev, [key]: !prev[key] }))
    }

    // Count answered questions per section for progress dots
    const sectionProgress = useMemo(() => {
        return TAX_SECTIONS.reduce<Record<string, number>>((acc, section) => {
            let count = 0
            for (const sub of section.subsections) {
                for (const q of sub.questions) {
                    const v = data[q.id as keyof TaxData]
                    if (v !== 0 && v !== "" && v !== false && v !== undefined) count++
                }
            }
            acc[section.id] = count
            return acc
        }, {})
    }, [data])

    function renderQuestion(q: typeof TAX_SECTIONS[0]["subsections"][0]["questions"][0]) {
        if (q.condition && !q.condition(data)) return null
        const val = data[q.id as keyof TaxData]

        return (
            <div key={q.id} className="flex flex-col gap-2 py-4 border-b border-outline-variant/20 last:border-0">
                <div className="flex flex-col gap-0.5">
                    <label htmlFor={q.id} className="font-body-md text-body-md text-on-surface font-medium leading-snug">
                        {q.label}
                    </label>
                    {q.helpText && (
                        <p className="font-body-md text-[12px] text-on-surface-variant leading-relaxed max-w-xl">
                            {q.helpText}
                        </p>
                    )}
                </div>

                {q.type === "number" && (
                    <div className="max-w-xs">
                        <NumberInput
                            id={q.id}
                            value={val as number}
                            onChange={v => update(q.id as keyof TaxData, v as TaxData[keyof TaxData])}
                            prefix={q.prefix}
                            suffix={q.suffix}
                            max={q.max}
                        />
                        {q.subLabel && <p className="text-[11px] text-on-surface-variant mt-1">{q.subLabel}</p>}
                    </div>
                )}
                {q.type === "boolean" && (
                    <BooleanInput
                        id={q.id}
                        value={val as boolean}
                        onChange={v => update(q.id as keyof TaxData, v as TaxData[keyof TaxData])}
                    />
                )}
                {q.type === "select" && (
                    <SelectInput
                        id={q.id}
                        value={val as string}
                        onChange={v => update(q.id as keyof TaxData, v as TaxData[keyof TaxData])}
                        options={q.options ?? []}
                    />
                )}
                {q.type === "text" && (
                    <TextInput
                        id={q.id}
                        value={val as string}
                        onChange={v => update(q.id as keyof TaxData, v as TaxData[keyof TaxData])}
                    />
                )}
            </div>
        )
    }

    const filingStatus = data.filingStatus || "single"
    const stateCode    = data.residenceState
    const directFile   = stateCode ? isDirectFileEligible(result.agi, stateCode) : false

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur sticky top-0 z-30">
                <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-ui-button text-ui-button uppercase tracking-[0.05em] text-sm">
                            <MaterialIcon name="arrow_back" size={16} />
                            Back
                        </button>
                        <div className="w-px h-4 bg-outline-variant/40" />
                        <p className="font-headline-sm text-headline-sm text-on-surface">2024 Tax Return</p>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 font-label-caps uppercase tracking-[0.15em] text-[9px] text-primary">Estimate</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => openTaxSummaryPDF({
                                filingStatus,
                                state: stateCode,
                                taxYear: 2024,
                                totalIncome: result.totalGrossIncome,
                                agi: result.agi,
                                deduction: result.deduction,
                                usingItemized: result.usingItemized,
                                taxableIncome: result.taxableIncome,
                                taxBeforeCredits: result.totalTaxBeforeCredits,
                                credits: result.totalCredits,
                                taxAfterCredits: result.taxAfterCredits,
                                withheld: result.totalWithheld,
                                refundOrOwed: result.refundOrOwed,
                                owes: result.owes,
                                marginalRate: result.marginalRate,
                                effectiveFederalRate: result.effectiveRate,
                                stateName: result.stateResult?.stateName ?? stateCode,
                                stateNoIncomeTax: result.stateResult?.noIncomeTax ?? false,
                                stateTaxableIncome: result.stateResult?.taxableIncome ?? 0,
                                stateTax: result.stateResult?.stateTax ?? 0,
                                stateEffectiveRate: result.stateResult?.effectiveRate ?? 0,
                            })}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary font-ui-button text-ui-button uppercase tracking-[0.05em] text-sm transition-colors"
                        >
                            <MaterialIcon name="download" size={14} />
                            Export PDF
                        </button>
                        {directFile ? (
                            <a
                                href="https://directfile.irs.gov"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] text-sm hover:opacity-90 transition-opacity"
                            >
                                <MaterialIcon name="verified" size={14} />
                                File Free with IRS
                            </a>
                        ) : (
                            <a
                                href="https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] text-sm hover:opacity-90 transition-opacity"
                            >
                                <MaterialIcon name="open_in_new" size={14} />
                                IRS Free File
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-[220px_1fr_300px] gap-8 items-start">

                {/* Left nav — sections */}
                <nav className="sticky top-[57px] flex flex-col gap-1">
                    {TAX_SECTIONS.map(section => {
                        const active = section.id === activeSectionId
                        const count  = sectionProgress[section.id] || 0
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSectionId(section.id)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors w-full group ${
                                    active
                                        ? "bg-primary/10 text-primary"
                                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                                }`}
                            >
                                <MaterialIcon name={section.icon} size={18} className="flex-shrink-0" />
                                <span className="font-body-md text-[13px] font-medium flex-1 leading-tight">{section.title}</span>
                                {count > 0 && (
                                    <span className={`text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 ${
                                        active ? "bg-primary text-on-primary" : "bg-primary/20 text-primary"
                                    }`}>
                                        ✓
                                    </span>
                                )}
                            </button>
                        )
                    })}

                    <div className="mt-4 pt-4 border-t border-outline-variant/20">
                        <div className="px-3">
                            <p className="font-label-caps uppercase tracking-[0.15em] text-[9px] text-on-surface-variant mb-1">Tax Year</p>
                            <p className="font-body-md text-[13px] font-bold text-on-surface">2024</p>
                        </div>
                    </div>
                </nav>

                {/* Main interview area */}
                <div className="min-w-0">
                    {activeSection && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <MaterialIcon name={activeSection.icon} size={22} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-headline-md text-headline-md text-on-surface">{activeSection.title}</h2>
                                    <p className="font-body-md text-[12px] text-on-surface-variant">
                                        {sectionProgress[activeSection.id] > 0
                                            ? `${sectionProgress[activeSection.id]} field${sectionProgress[activeSection.id] === 1 ? "" : "s"} completed`
                                            : "Answer the questions below to calculate your taxes"}
                                    </p>
                                </div>
                            </div>

                            {activeSection.subsections.map((sub, subIdx) => {
                                if (sub.condition && !sub.condition(data)) return null
                                const subKey = `${activeSection.id}-${subIdx}`
                                const isExpanded = expandedSubsections[subKey] !== false   // default open

                                // Filter to visible questions
                                const visibleQs = sub.questions.filter(q => !q.condition || q.condition(data))
                                if (visibleQs.length === 0) return null

                                // Check if subsection is a "large" expense block that should be collapsible
                                const collapsible = visibleQs.length > 5

                                return (
                                    <div key={subKey} className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => collapsible && toggleSubsection(subKey)}
                                            className={`w-full flex items-center justify-between px-6 py-4 text-left ${collapsible ? "cursor-pointer hover:bg-surface-container transition-colors" : "cursor-default"}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-body-md text-[14px] font-semibold text-on-surface">{sub.title}</h3>
                                                <span className="font-label-caps uppercase tracking-[0.1em] text-[9px] text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">
                                                    {visibleQs.length} {visibleQs.length === 1 ? "field" : "fields"}
                                                </span>
                                            </div>
                                            {collapsible && (
                                                <MaterialIcon
                                                    name={isExpanded ? "expand_less" : "expand_more"}
                                                    size={18}
                                                    className="text-on-surface-variant flex-shrink-0"
                                                />
                                            )}
                                        </button>
                                        {(!collapsible || isExpanded) && (
                                            <div className="px-6 pb-4">
                                                {visibleQs.map(q => renderQuestion(q))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Section navigation */}
                            <div className="flex justify-between pt-2">
                                {(() => {
                                    const idx = TAX_SECTIONS.findIndex(s => s.id === activeSectionId)
                                    const prev = TAX_SECTIONS[idx - 1]
                                    const next = TAX_SECTIONS[idx + 1]
                                    return (
                                        <>
                                            {prev ? (
                                                <button onClick={() => setActiveSectionId(prev.id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary font-ui-button text-ui-button uppercase tracking-[0.05em] text-sm transition-colors">
                                                    <MaterialIcon name="arrow_back" size={14} />
                                                    {prev.title}
                                                </button>
                                            ) : <div />}
                                            {next ? (
                                                <button onClick={() => setActiveSectionId(next.id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] text-sm hover:opacity-90 transition-opacity">
                                                    {next.title}
                                                    <MaterialIcon name="arrow_forward" size={14} />
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    {directFile ? (
                                                        <a href="https://directfile.irs.gov" target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] text-sm hover:opacity-90 transition-opacity">
                                                            <MaterialIcon name="verified" size={14} />
                                                            File Free with IRS Direct File
                                                        </a>
                                                    ) : (
                                                        <a href="https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free" target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] text-sm hover:opacity-90 transition-opacity">
                                                            <MaterialIcon name="open_in_new" size={14} />
                                                            IRS Free File
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right sidebar — live estimate */}
                <EstimateSidebar result={result} />
            </div>

            {/* Bottom informational bar */}
            <div className="border-t border-outline-variant/20 bg-surface-container-lowest/60 mt-8">
                <div className="max-w-[1400px] mx-auto px-6 py-3 flex flex-wrap items-center gap-x-8 gap-y-1">
                    {[
                        ["Gross Income",    `$${fmt(result.totalGrossIncome)}`],
                        ["AGI",             `$${fmt(result.agi)}`],
                        ["Taxable Income",  `$${fmt(result.taxableIncome)}`],
                        ["Federal Tax",     `$${fmt(result.taxAfterCredits)}`],
                        result.stateResult && !result.stateResult.noIncomeTax
                            ? ["State Tax", `$${fmt(result.stateResult.stateTax)}`]
                            : null,
                        ["Withheld",        `$${fmt(result.totalPayments)}`],
                    ].filter((x): x is [string, string] => Array.isArray(x)).map(([label, value]) => (
                        <div key={String(label)} className="flex items-center gap-2">
                            <span className="font-label-caps uppercase tracking-[0.1em] text-[9px] text-on-surface-variant">{label}</span>
                            <span className="font-body-md text-[13px] font-semibold text-on-surface tabular-nums">{value}</span>
                        </div>
                    ))}
                    <div className="ml-auto flex items-center gap-1.5 text-on-surface-variant">
                        <MaterialIcon name="info" size={12} />
                        <span className="font-label-caps uppercase tracking-[0.1em] text-[9px]">Estimate only — 2024 tax law</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
