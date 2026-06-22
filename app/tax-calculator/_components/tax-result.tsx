"use client"

import * as React from "react"
import {
    ResultMetric,
    ResultMetricsGrid,
    ResultPanel,
    ResultPrimary,
} from "@/components/ds/calculator-result"
import { Eyebrow } from "@/components/ds/eyebrow"
import { formatCurrency, formatPercent } from "@/lib/money/decimal"
import type { TaxResult } from "@/lib/types/tax"

interface TaxResultDisplayProps {
    result: TaxResult
}

export function TaxResultDisplay({ result }: TaxResultDisplayProps) {
    if (result.kind === "individual") {
        return (
            <ResultPanel>
                <ResultPrimary
                    label="Federal Tax Owed"
                    value={formatCurrency(result.finalTax)}
                    sublabel={`${result.usingStandardDeduction ? "Standard" : "Itemized"} deduction · ${formatPercent(result.marginalRatePercent, 0)} marginal · ${formatPercent(result.effectiveRatePercent, 1)} effective`}
                />
                <ResultMetricsGrid>
                    <ResultMetric
                        label="Tax Savings"
                        value={formatCurrency(result.taxSavings)}
                    />
                    <ResultMetric
                        label="Tax Credits"
                        value={formatCurrency(result.taxCredits)}
                    />
                </ResultMetricsGrid>
                <TaxBreakdown
                    rows={[
                        { label: "Gross Income", value: formatCurrency(result.grossIncome) },
                        {
                            label: "Adjusted Gross Income",
                            value: formatCurrency(result.adjustedGrossIncome),
                        },
                        {
                            label: result.usingStandardDeduction
                                ? "Standard Deduction"
                                : "Itemized Deductions",
                            value: `−${formatCurrency(result.totalDeductions)}`,
                            tone: "subtract",
                        },
                        {
                            label: "Taxable Income",
                            value: formatCurrency(result.taxableIncome),
                            divider: true,
                        },
                        {
                            label: "Federal Tax",
                            value: formatCurrency(result.federalTax),
                        },
                        {
                            label: "Tax Credits",
                            value: `−${formatCurrency(result.taxCredits)}`,
                            tone: "subtract",
                        },
                        {
                            label: "Final Tax",
                            value: formatCurrency(result.finalTax),
                            divider: true,
                            emphasize: true,
                        },
                    ]}
                />
            </ResultPanel>
        )
    }

    return (
        <ResultPanel>
            <ResultPrimary
                label="Total Tax (Federal + SE)"
                value={formatCurrency(result.totalTax)}
                sublabel={`${formatPercent(result.marginalRatePercent, 0)} marginal · ${formatPercent(result.effectiveRatePercent, 1)} effective`}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Tax Savings"
                    value={formatCurrency(result.taxSavings)}
                />
                <ResultMetric
                    label="Self-Employment Tax"
                    value={formatCurrency(result.selfEmploymentTax)}
                />
            </ResultMetricsGrid>
            <TaxBreakdown
                rows={[
                    {
                        label: "Business Income",
                        value: formatCurrency(result.businessIncome),
                    },
                    {
                        label: "Business Deductions",
                        value: `−${formatCurrency(result.totalDeductions)}`,
                        tone: "subtract",
                    },
                    {
                        label: "Net Business Income",
                        value: formatCurrency(result.netBusinessIncome),
                        divider: true,
                    },
                    {
                        label: "Self-Employment Tax",
                        value: formatCurrency(result.selfEmploymentTax),
                    },
                    {
                        label: "½ SE Tax (deductible)",
                        value: `−${formatCurrency(result.deductibleSETax)}`,
                        tone: "subtract",
                    },
                    {
                        label: "Federal Income Tax",
                        value: formatCurrency(result.federalTax),
                    },
                    {
                        label: "Total Tax",
                        value: formatCurrency(result.totalTax),
                        divider: true,
                        emphasize: true,
                    },
                ]}
            />
        </ResultPanel>
    )
}

interface BreakdownRow {
    label: string
    value: string
    tone?: "default" | "subtract"
    divider?: boolean
    emphasize?: boolean
}

function TaxBreakdown({ rows }: { rows: BreakdownRow[] }) {
    return (
        <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/30">
            <Eyebrow>Breakdown</Eyebrow>
            <dl className="flex flex-col">
                {rows.map((row, idx) => (
                    <div
                        key={`${row.label}-${idx}`}
                        className={
                            "flex justify-between items-baseline py-2" +
                            (row.divider ? " border-t border-outline-variant/20 mt-1 pt-3" : "") +
                            (row.emphasize ? " text-primary" : "")
                        }
                    >
                        <dt
                            className={`font-body-md text-body-md ${
                                row.emphasize ? "text-primary" : "text-on-surface-variant"
                            }`}
                        >
                            {row.label}
                        </dt>
                        <dd
                            className={`font-body-md text-body-md tabular-nums ${
                                row.emphasize
                                    ? "font-headline-md text-[20px] text-primary"
                                    : row.tone === "subtract"
                                        ? "text-on-surface-variant"
                                        : "text-on-background"
                            }`}
                        >
                            {row.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    )
}
