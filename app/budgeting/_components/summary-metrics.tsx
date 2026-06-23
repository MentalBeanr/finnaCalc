"use client"

import { Eyebrow } from "@/components/ds/eyebrow"
import { formatCurrency, formatPercent } from "@/lib/money/decimal"
import type { BudgetTotals } from "@/lib/types/budget"

interface SummaryMetricsProps {
    totals: BudgetTotals
}

export function SummaryMetrics({ totals }: SummaryMetricsProps) {
    const isPositive = totals.monthlyNet.gte(0)
    return (
        <div className="grid grid-cols-4 gap-gutter">
            <MetricCard label="Monthly Income" value={formatCurrency(totals.monthlyIncome)} />
            <MetricCard
                label="Monthly Expenses"
                value={formatCurrency(totals.monthlyExpenses)}
            />
            <MetricCard
                label={isPositive ? "Monthly Net" : "Monthly Shortfall"}
                value={formatCurrency(totals.monthlyNet.abs())}
                emphasize
            />
            <MetricCard
                label="Savings Rate"
                value={formatPercent(totals.savingsRatePercent, 1)}
            />
        </div>
    )
}

function MetricCard({
    label,
    value,
    emphasize,
}: {
    label: string
    value: string
    emphasize?: boolean
}) {
    return (
        <div className="flex flex-col gap-stack-sm border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-8">
            <Eyebrow>{label}</Eyebrow>
            <div
                className={
                    "font-headline-md text-[32px] leading-[1.2] tracking-[-0.01em] text-primary tabular-nums" +
                    (emphasize ? " font-headline-display" : "")
                }
            >
                {value}
            </div>
        </div>
    )
}
