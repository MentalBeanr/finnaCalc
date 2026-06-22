"use client"

import * as React from "react"
import { DataChart, type DataChartPoint } from "@/components/ds/data-chart"
import { Eyebrow } from "@/components/ds/eyebrow"
import { ResultMetric } from "@/components/ds/calculator-result"
import { formatCurrency } from "@/lib/money/decimal"
import type { CashFlowResult } from "@/lib/types/cash-flow"

interface CashFlowChartProps {
    result: CashFlowResult
}

const COMPACT = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
    signDisplay: "auto",
})

export function CashFlowChart({ result }: CashFlowChartProps) {
    const points = React.useMemo<DataChartPoint[]>(() => {
        return result.projections.map((row) => ({
            x: row.month,
            y: Number(row.cumulativeCash.toFixed(2)),
        }))
    }, [result])

    if (points.length === 0) return null

    const referenceLines: Array<{
        axis: "x" | "y"
        value: number
        label?: string
        tone: "primary" | "muted"
    }> = []

    // Always show the zero line if any month dips into or near negative territory
    const anyNegative = points.some((p) => p.y < 0)
    if (anyNegative) {
        referenceLines.push({
            axis: "y",
            value: 0,
            label: "Out of cash",
            tone: "muted",
        })
    }
    if (result.runwayMonths !== null) {
        referenceLines.push({
            axis: "x",
            value: result.runwayMonths,
            label: `Month ${result.runwayMonths}`,
            tone: "primary",
        })
    }

    return (
        <div className="flex flex-col gap-stack-lg border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-6 md:p-10">
            <div className="flex flex-col gap-stack-md md:flex-row md:items-end md:justify-between border-b border-outline-variant/20 pb-stack-md">
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>Cash Trajectory</Eyebrow>
                    <h3 className="font-headline-md text-headline-md text-primary">
                        Cumulative balance over time
                    </h3>
                </div>
                <div className="flex gap-stack-lg">
                    <ResultMetric
                        label="Final Cash"
                        value={formatCurrency(result.finalCash)}
                    />
                    <ResultMetric
                        label="Avg Monthly Net"
                        value={formatCurrency(result.averageMonthlyNetCashFlow)}
                    />
                </div>
            </div>
            <DataChart
                data={points}
                height={320}
                formatX={(value) => `M${value}`}
                formatY={(value) => COMPACT.format(value)}
                referenceLines={referenceLines}
                ariaLabel={`Cumulative cash balance over ${points.length} months${result.runwayMonths !== null ? `, going negative at month ${result.runwayMonths}` : ""}`}
            />
        </div>
    )
}
