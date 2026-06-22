"use client"

import * as React from "react"
import { DataChart, type DataChartPoint } from "@/components/ds/data-chart"
import { Eyebrow } from "@/components/ds/eyebrow"
import { ResultMetric } from "@/components/ds/calculator-result"
import { formatCurrency } from "@/lib/money/decimal"
import { parseAmount } from "@/lib/money/decimal"
import type { EmergencyResult } from "@/lib/types/emergency"
import type { EmergencyFormState } from "@/lib/validators/emergency"

interface EmergencyChartProps {
    form: EmergencyFormState
    result: EmergencyResult
}

const COMPACT = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
})

const MAX_PROJECTED_MONTHS = 600

export function EmergencyChart({ form, result }: EmergencyChartProps) {
    const points = React.useMemo<DataChartPoint[]>(() => {
        if (result.timeToGoalMonths === null) return []
        const currentSavings = parseAmount(form.currentSavings) ?? parseAmount("0")
        const contribution = parseAmount(form.monthlyContribution) ?? parseAmount("0")
        const annualRate = parseAmount(form.annualRatePercent) ?? parseAmount("0")
        if (!currentSavings || !contribution || !annualRate) return []

        const monthlyRate = annualRate.div(100).div(12).toNumber()
        const target = result.targetAmount.toNumber()
        const months = Math.min(
            Math.max(1, Math.ceil(result.timeToGoalMonths.toNumber())),
            MAX_PROJECTED_MONTHS,
        )

        let balance = currentSavings.toNumber()
        const pmt = contribution.toNumber()
        const out: DataChartPoint[] = [{ x: 0, y: Number(balance.toFixed(2)) }]
        for (let m = 1; m <= months; m++) {
            balance = balance * (1 + monthlyRate) + pmt
            out.push({ x: m, y: Number(Math.min(balance, target * 1.0001).toFixed(2)) })
            if (balance >= target) break
        }
        return out
    }, [form, result])

    if (points.length === 0) return null

    return (
        <div className="flex flex-col gap-stack-lg border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-6 md:p-10">
            <div className="flex flex-col gap-stack-md md:flex-row md:items-end md:justify-between border-b border-outline-variant/20 pb-stack-md">
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>Savings Trajectory</Eyebrow>
                    <h3 className="font-headline-md text-headline-md text-primary">
                        Balance growing toward target
                    </h3>
                </div>
                <div className="flex gap-stack-lg">
                    <ResultMetric
                        label="Target"
                        value={formatCurrency(result.targetAmount)}
                    />
                    <ResultMetric
                        label="Interest Earned"
                        value={formatCurrency(result.interestEarned)}
                    />
                </div>
            </div>
            <DataChart
                data={points}
                height={320}
                formatX={(value) => `Month ${value}`}
                formatY={(value) => COMPACT.format(value)}
                ariaLabel={`Emergency fund balance growing from current savings to target over ${points.length - 1} months`}
            />
        </div>
    )
}
