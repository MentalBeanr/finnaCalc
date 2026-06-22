"use client"

import {
    ResultMetric,
    ResultMetricsGrid,
    ResultPanel,
    ResultPrimary,
} from "@/components/ds/calculator-result"
import { Eyebrow } from "@/components/ds/eyebrow"
import { formatCurrency, formatPercent } from "@/lib/money/decimal"
import type { ProfitMarginResult } from "@/lib/types/profit-margin"

interface ProfitMarginResultDisplayProps {
    result: ProfitMarginResult
}

export function ProfitMarginResultDisplay({ result }: ProfitMarginResultDisplayProps) {
    return (
        <ResultPanel>
            <ResultPrimary
                label="Net Profit Margin"
                value={formatPercent(result.netMarginPercent, 2)}
                sublabel={`${formatCurrency(result.netProfit)} on ${formatCurrency(result.revenue)} of revenue`}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Gross Margin"
                    value={formatPercent(result.grossMarginPercent, 2)}
                />
                <ResultMetric
                    label="Operating Margin"
                    value={formatPercent(result.operatingMarginPercent, 2)}
                />
                <ResultMetric
                    label="Gross Profit"
                    value={formatCurrency(result.grossProfit)}
                />
                <ResultMetric
                    label="Operating Profit"
                    value={formatCurrency(result.operatingProfit)}
                />
            </ResultMetricsGrid>

            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/30">
                <Eyebrow>Breakdown</Eyebrow>
                <dl className="flex flex-col">
                    <BreakdownRow label="Revenue" value={formatCurrency(result.revenue)} />
                    <BreakdownRow
                        label="Cost of Goods Sold"
                        value={`−${formatCurrency(result.costOfGoodsSold)}`}
                        muted
                    />
                    <BreakdownRow
                        label="Gross Profit"
                        value={formatCurrency(result.grossProfit)}
                        divider
                    />
                    <BreakdownRow
                        label="Operating Expenses"
                        value={`−${formatCurrency(result.operatingExpenses)}`}
                        muted
                    />
                    <BreakdownRow
                        label="Operating Profit"
                        value={formatCurrency(result.operatingProfit)}
                        divider
                    />
                    {result.taxes.gt(0) ? (
                        <BreakdownRow
                            label="Income Tax"
                            value={`−${formatCurrency(result.taxes)}`}
                            muted
                        />
                    ) : null}
                    <BreakdownRow
                        label="Net Profit"
                        value={formatCurrency(result.netProfit)}
                        divider
                        emphasize
                    />
                </dl>
            </div>
        </ResultPanel>
    )
}

function BreakdownRow({
    label,
    value,
    muted,
    divider,
    emphasize,
}: {
    label: string
    value: string
    muted?: boolean
    divider?: boolean
    emphasize?: boolean
}) {
    return (
        <div
            className={
                "flex justify-between items-baseline py-2" +
                (divider ? " border-t border-outline-variant/20 mt-1 pt-3" : "")
            }
        >
            <dt
                className={`font-body-md text-body-md ${
                    emphasize ? "text-primary" : "text-on-surface-variant"
                }`}
            >
                {label}
            </dt>
            <dd
                className={`font-body-md text-body-md tabular-nums ${
                    emphasize
                        ? "font-headline-md text-[20px] text-primary"
                        : muted
                            ? "text-on-surface-variant"
                            : "text-on-background"
                }`}
            >
                {value}
            </dd>
        </div>
    )
}
