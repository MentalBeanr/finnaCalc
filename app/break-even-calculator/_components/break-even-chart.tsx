"use client"

import * as React from "react"
import { DataChart, type DataChartPoint } from "@/components/ds/data-chart"
import { Eyebrow } from "@/components/ds/eyebrow"
import { ResultMetric } from "@/components/ds/calculator-result"
import { formatCurrency, formatNumber } from "@/lib/money/decimal"
import type { BreakEvenInput, BreakEvenResult } from "@/lib/types/break-even"

interface BreakEvenChartProps {
    input: BreakEvenInput
    result: BreakEvenResult
}

const COMPACT = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
    signDisplay: "auto",
})

const STEPS = 60

/**
 * Profit curve crossing zero exactly at break-even.
 *   profit(u) = (price − variableCost) × u − fixedCosts
 *            = contributionMargin × u − fixedCosts
 */
export function BreakEvenChart({ input, result }: BreakEvenChartProps) {
    const points = React.useMemo<DataChartPoint[]>(() => {
        const breakEven = result.breakEvenUnits.toNumber()
        const target = result.unitsForTargetProfit.toNumber()
        const maxX = Math.max(target, breakEven) * 1.5
        const fixedCosts = input.fixedCosts.toNumber()
        const cm = result.contributionMargin.toNumber()
        const out: DataChartPoint[] = []
        for (let i = 0; i <= STEPS; i++) {
            const u = (i / STEPS) * maxX
            const profit = cm * u - fixedCosts
            out.push({ x: Math.round(u), y: Number(profit.toFixed(2)) })
        }
        return out
    }, [input, result])

    if (points.length === 0) return null

    const unitsLabel =
        result.businessType === "service" ? "services" : "units"

    return (
        <div className="flex flex-col gap-stack-lg border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
            <div className="flex flex-row items-end justify-between gap-stack-md border-b border-outline-variant/20 pb-stack-md">
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>Cost-Volume-Profit</Eyebrow>
                    <h3 className="font-headline-md text-headline-md text-primary">
                        Profit as volume rises
                    </h3>
                </div>
                <div className="flex gap-stack-lg">
                    <ResultMetric
                        label="Break-Even"
                        value={`${formatNumber(result.breakEvenUnits)} ${unitsLabel}`}
                    />
                    <ResultMetric
                        label="Fixed Costs"
                        value={formatCurrency(input.fixedCosts)}
                    />
                </div>
            </div>
            <DataChart
                data={points}
                height={320}
                formatX={(value) => `${value}`}
                formatY={(value) => COMPACT.format(value)}
                referenceLines={[
                    { axis: "y", value: 0, label: "Break even", tone: "muted" },
                    {
                        axis: "x",
                        value: result.breakEvenUnits.toNumber(),
                        label: `${formatNumber(result.breakEvenUnits)} ${unitsLabel}`,
                        tone: "primary",
                    },
                ]}
                ariaLabel={`Profit curve crossing zero at ${formatNumber(result.breakEvenUnits)} ${unitsLabel}`}
            />
        </div>
    )
}
