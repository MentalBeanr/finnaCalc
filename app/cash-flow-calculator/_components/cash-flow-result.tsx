"use client"

import {
    ResultMetric,
    ResultMetricsGrid,
    ResultPanel,
    ResultPrimary,
} from "@/components/ds/calculator-result"
import { formatCurrency } from "@/lib/money/decimal"
import type { CashFlowResult } from "@/lib/types/cash-flow"

interface CashFlowResultDisplayProps {
    result: CashFlowResult
}

export function CashFlowResultDisplay({ result }: CashFlowResultDisplayProps) {
    const isNetPositive = result.netCashFlow.gte(0)
    const sublabel = isNetPositive
        ? `Net ${formatCurrency(result.netCashFlow)} of cash generated over the horizon`
        : `Net ${formatCurrency(result.netCashFlow.abs())} of cash burned over the horizon`

    return (
        <ResultPanel>
            <ResultPrimary
                label="Final Cash Balance"
                value={formatCurrency(result.finalCash)}
                sublabel={sublabel}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Total Revenue"
                    value={formatCurrency(result.totalRevenue)}
                />
                <ResultMetric
                    label="Total Expenses"
                    value={formatCurrency(result.totalExpenses)}
                />
                <ResultMetric
                    label="Avg Monthly Net"
                    value={formatCurrency(result.averageMonthlyNetCashFlow)}
                />
                <ResultMetric
                    label="Runway"
                    value={
                        result.runwayMonths === null
                            ? "Solvent"
                            : `Month ${result.runwayMonths}`
                    }
                />
            </ResultMetricsGrid>
        </ResultPanel>
    )
}
