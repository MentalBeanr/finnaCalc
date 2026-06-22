"use client"

import {
    ResultMetric,
    ResultMetricsGrid,
    ResultPanel,
    ResultPrimary,
} from "@/components/ds/calculator-result"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/money/decimal"
import type { EmergencyResult } from "@/lib/types/emergency"

interface EmergencyResultDisplayProps {
    result: EmergencyResult
}

export function EmergencyResultDisplay({ result }: EmergencyResultDisplayProps) {
    const timeToGoal =
        result.timeToGoalMonths === null
            ? "Unreachable"
            : result.timeToGoalMonths.eq(0)
                ? "Goal reached"
                : `${formatNumber(result.timeToGoalMonths)} months`

    return (
        <ResultPanel>
            <ResultPrimary
                label="Target Fund"
                value={formatCurrency(result.targetAmount)}
                sublabel={`${formatPercent(result.percentComplete, 1)} funded · ${formatNumber(result.monthsCovered, 1)} months of expenses covered today`}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Still Needed"
                    value={formatCurrency(result.stillNeeded)}
                />
                <ResultMetric label="Time to Goal" value={timeToGoal} />
                <ResultMetric
                    label="You Contribute"
                    value={formatCurrency(result.principalContributed)}
                />
                <ResultMetric
                    label="Interest Earned"
                    value={formatCurrency(result.interestEarned)}
                />
            </ResultMetricsGrid>
        </ResultPanel>
    )
}
