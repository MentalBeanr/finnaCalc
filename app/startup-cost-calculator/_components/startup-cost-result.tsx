"use client"

import {
    ResultMetric,
    ResultMetricsGrid,
    ResultPanel,
    ResultPrimary,
} from "@/components/ds/calculator-result"
import { Eyebrow } from "@/components/ds/eyebrow"
import { formatCurrency, formatPercent } from "@/lib/money/decimal"
import type { StartupCostResult } from "@/lib/types/startup-cost"

interface StartupCostResultDisplayProps {
    result: StartupCostResult
}

export function StartupCostResultDisplay({ result }: StartupCostResultDisplayProps) {
    const overfunded = result.fundingGap.lte(0)
    const gapMagnitude = result.fundingGap.abs()

    return (
        <ResultPanel>
            <ResultPrimary
                label="Recommended Capital"
                value={formatCurrency(result.totalWithBuffer)}
                sublabel={`${formatCurrency(result.totalCosts)} line items plus ${formatCurrency(result.bufferAmount)} buffer`}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Total Funding"
                    value={formatCurrency(result.totalFunding)}
                />
                <ResultMetric
                    label={overfunded ? "Surplus" : "Funding Gap"}
                    value={formatCurrency(gapMagnitude)}
                />
                <ResultMetric
                    label="Coverage"
                    value={formatPercent(result.fundingCoveragePercent, 0)}
                />
                <ResultMetric
                    label="Buffer Applied"
                    value={formatCurrency(result.bufferAmount)}
                />
            </ResultMetricsGrid>

            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/30">
                <Eyebrow>Cost Breakdown</Eyebrow>
                <div className="flex flex-col gap-stack-md">
                    {result.costCategories.map((category) => {
                        const pct = Number(category.percentOfTotal.toString())
                        return (
                            <div
                                key={category.key}
                                className="flex flex-col gap-1.5"
                            >
                                <div className="flex justify-between items-baseline">
                                    <span className="font-body-md text-body-md text-on-background">
                                        {category.label}
                                    </span>
                                    <span className="font-body-md text-body-md text-on-background tabular-nums">
                                        {formatCurrency(category.value)}
                                        <span className="text-on-surface-variant ml-2">
                                            {formatPercent(category.percentOfTotal, 1)}
                                        </span>
                                    </span>
                                </div>
                                <div
                                    className="h-1 bg-surface-container rounded-full overflow-hidden"
                                    aria-hidden="true"
                                >
                                    <div
                                        className="h-full bg-primary/70 rounded-full"
                                        style={{ width: `${Math.min(100, pct)}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/30">
                <Eyebrow>Funding Coverage</Eyebrow>
                <div
                    className="h-2 bg-surface-container rounded-full overflow-hidden"
                    aria-hidden="true"
                >
                    <div
                        className="h-full bg-primary rounded-full"
                        style={{
                            width: `${Math.min(100, Number(result.fundingCoveragePercent.toString()))}%`,
                        }}
                    />
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                    {overfunded
                        ? `Funding exceeds the recommended capital by ${formatCurrency(gapMagnitude)}.`
                        : `An additional ${formatCurrency(gapMagnitude)} is needed to fully fund the recommended capital.`}
                </p>
            </div>
        </ResultPanel>
    )
}
