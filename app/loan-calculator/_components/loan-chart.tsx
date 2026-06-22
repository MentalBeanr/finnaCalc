"use client"

import * as React from "react"
import { DataChart, type DataChartPoint } from "@/components/ds/data-chart"
import { Eyebrow } from "@/components/ds/eyebrow"
import { ResultMetric } from "@/components/ds/calculator-result"
import { buildAmortizationSchedule } from "@/lib/calculations/loan"
import { formatCurrency, parseAmount } from "@/lib/money/decimal"
import type { PaymentFormState } from "@/lib/validators/loan"
import type { PaymentFrequency } from "@/lib/types/loan"

interface LoanChartProps {
    paymentForm: PaymentFormState
}

const COMPACT_CURRENCY = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
})

export function LoanChart({ paymentForm }: LoanChartProps) {
    const data = React.useMemo<{
        points: DataChartPoint[]
        totalInterest: string
        totalPayment: string
        frequency: PaymentFrequency
    } | null>(() => {
        const loanAmount = parseAmount(paymentForm.loanAmount)
        const interestRate = parseAmount(paymentForm.interestRate)
        const termMonths = parseAmount(paymentForm.termMonths)
        const downPayment = parseAmount(paymentForm.downPayment) ?? parseAmount("0")
        if (!loanAmount || !interestRate || !termMonths || !downPayment) return null
        if (loanAmount.lte(0) || termMonths.lte(0)) return null

        const schedule = buildAmortizationSchedule({
            loanAmount,
            interestRate,
            termMonths,
            downPayment,
            frequency: paymentForm.frequency,
        })
        if (schedule.length === 0) return null

        const startingBalance = loanAmount.minus(downPayment)
        const points: DataChartPoint[] = [
            { x: 0, y: Number(startingBalance.toFixed(2)) },
            ...schedule.map((row) => ({
                x: row.period,
                y: Number(row.balance.toFixed(2)),
            })),
        ]

        const finalRow = schedule[schedule.length - 1]
        return {
            points,
            totalInterest: formatCurrency(finalRow.cumulativeInterest),
            totalPayment: formatCurrency(finalRow.cumulativePrincipal.plus(finalRow.cumulativeInterest)),
            frequency: paymentForm.frequency,
        }
    }, [paymentForm])

    if (!data) return null

    const periodLabel: Record<PaymentFrequency, string> = {
        monthly: "Month",
        biweekly: "Period",
        weekly: "Week",
        quarterly: "Quarter",
        annually: "Year",
    }

    return (
        <div className="flex flex-col gap-stack-lg border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10">
            <div className="flex flex-row items-end justify-between gap-stack-md border-b border-outline-variant/20 pb-stack-md">
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>Amortization</Eyebrow>
                    <h3 className="font-headline-md text-headline-md text-primary">
                        Balance over time
                    </h3>
                </div>
                <div className="flex gap-stack-lg">
                    <ResultMetric label="Total Interest" value={data.totalInterest} />
                    <ResultMetric label="Total Payments" value={data.totalPayment} />
                </div>
            </div>
            <DataChart
                data={data.points}
                height={320}
                formatX={(value) => `${periodLabel[data.frequency]} ${value}`}
                formatY={(value) => COMPACT_CURRENCY.format(value)}
                ariaLabel={`Amortization chart showing remaining balance from ${data.points[0].y} declining to zero over ${data.points.length - 1} periods`}
            />
        </div>
    )
}
