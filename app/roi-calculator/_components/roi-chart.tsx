"use client"

import * as React from "react"
import { DataChart, type DataChartPoint } from "@/components/ds/data-chart"
import { Eyebrow } from "@/components/ds/eyebrow"
import { ResultMetric } from "@/components/ds/calculator-result"
import { formatCurrency, formatPercent } from "@/lib/money/decimal"
import type { RoiResult } from "@/lib/types/roi"

interface RoiChartProps {
    result: RoiResult
}

const COMPACT = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
})

const STEPS = 40

export function RoiChart({ result }: RoiChartProps) {
    const points = React.useMemo<DataChartPoint[]>(() => {
        const initial = result.initialInvestment.toNumber()
        const years = result.timeYears.toNumber()
        const annualized = result.annualizedRoiPercent.toNumber() / 100
        // For a simple-method (linear) result, the implied per-year growth still
        // compounds when projected forward. We show CAGR-equivalent growth here
        // so the curve always rises smoothly to the actual final value.
        const finalValue = result.finalValue.toNumber()
        // Solve growth so curve hits finalValue at year = years.
        // value(t) = initial * (final/initial)^(t/years)
        const out: DataChartPoint[] = []
        if (years <= 0 || initial <= 0) return out
        for (let i = 0; i <= STEPS; i++) {
            const t = (i / STEPS) * years
            const value =
                initial * Math.pow(finalValue / initial, t / years || 0)
            out.push({ x: Number(t.toFixed(2)), y: Number(value.toFixed(2)) })
        }
        // Suppress unused var lint
        void annualized
        return out
    }, [result])

    if (points.length === 0) return null

    return (
        <div className="flex flex-col gap-stack-lg border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
            <div className="flex flex-row items-end justify-between gap-stack-md border-b border-outline-variant/20 pb-stack-md">
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>Growth Trajectory</Eyebrow>
                    <h3 className="font-headline-md text-headline-md text-primary">
                        Investment value over time
                    </h3>
                </div>
                <div className="flex gap-stack-lg">
                    <ResultMetric
                        label="Annualized"
                        value={formatPercent(result.annualizedRoiPercent)}
                    />
                    <ResultMetric
                        label="Final Value"
                        value={formatCurrency(result.finalValue)}
                    />
                </div>
            </div>
            <DataChart
                data={points}
                height={320}
                formatX={(value) => `Y${value}`}
                formatY={(value) => COMPACT.format(value)}
                ariaLabel={`Investment growth from ${formatCurrency(result.initialInvestment)} to ${formatCurrency(result.finalValue)} over ${result.timeYears.toString()} years`}
            />
        </div>
    )
}
