"use client"

import {
    ResultMetric,
    ResultMetricsGrid,
    ResultPanel,
    ResultPrimary,
} from "@/components/ds/calculator-result"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/money/decimal"
import type { BreakEvenResult } from "@/lib/types/break-even"

interface BreakEvenResultDisplayProps {
    result: BreakEvenResult
    hasSeasonality: boolean
}

function unitNoun(type: BreakEvenResult["businessType"]) {
    return type === "service" ? "services" : "units"
}

export function BreakEvenResultDisplay({
    result,
    hasSeasonality,
}: BreakEvenResultDisplayProps) {
    const units = unitNoun(result.businessType)

    return (
        <ResultPanel>
            <ResultPrimary
                label={`Break-Even ${units}`}
                value={`${formatNumber(result.breakEvenUnits)}`}
                sublabel={`Each ${units.slice(0, -1)} contributes ${formatCurrency(result.contributionMargin)} toward fixed costs`}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Break-Even Revenue"
                    value={formatCurrency(result.breakEvenRevenue)}
                />
                <ResultMetric
                    label="Contribution Margin"
                    value={formatPercent(result.contributionMarginRatio, 1)}
                />
                <ResultMetric
                    label={`${units.charAt(0).toUpperCase() + units.slice(1)} for Target`}
                    value={formatNumber(result.unitsForTargetProfit)}
                />
                <ResultMetric
                    label="Margin of Safety"
                    value={formatPercent(result.marginOfSafetyPercent, 1)}
                />
                {hasSeasonality ? (
                    <>
                        <ResultMetric
                            label="Seasonal Break-Even"
                            value={formatNumber(result.seasonalBreakEvenUnits)}
                        />
                        <ResultMetric
                            label="Seasonal Target"
                            value={formatNumber(result.seasonalTargetUnits)}
                        />
                    </>
                ) : null}
            </ResultMetricsGrid>
        </ResultPanel>
    )
}
