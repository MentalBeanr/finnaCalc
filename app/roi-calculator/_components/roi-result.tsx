"use client"

import {
    ResultMetric,
    ResultMetricsGrid,
    ResultPanel,
    ResultPrimary,
} from "@/components/ds/calculator-result"
import { formatCurrency, formatPercent } from "@/lib/money/decimal"
import type { RoiResult } from "@/lib/types/roi"

interface RoiResultDisplayProps {
    result: RoiResult
}

export function RoiResultDisplay({ result }: RoiResultDisplayProps) {
    return (
        <ResultPanel>
            <ResultPrimary
                label="Annualized Return"
                value={formatPercent(result.annualizedRoiPercent)}
                sublabel={`Total return ${formatCurrency(result.totalReturn)} over ${result.timeYears.toString()} year${result.timeYears.eq(1) ? "" : "s"}`}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Total ROI"
                    value={formatPercent(result.totalRoiPercent)}
                />
                <ResultMetric
                    label="After-Tax Return"
                    value={formatCurrency(result.afterTaxReturn)}
                />
                <ResultMetric
                    label="Real Annualized"
                    value={formatPercent(result.realAnnualizedRoiPercent)}
                />
                <ResultMetric
                    label="Real Final Value"
                    value={formatCurrency(result.realFinalValue)}
                />
                <ResultMetric
                    label="Dividend Income"
                    value={formatCurrency(result.totalDividendIncome)}
                />
                <ResultMetric
                    label="Total Tax"
                    value={formatCurrency(result.totalTax)}
                />
            </ResultMetricsGrid>
        </ResultPanel>
    )
}
