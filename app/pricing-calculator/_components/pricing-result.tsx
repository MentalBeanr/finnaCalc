"use client"

import * as React from "react"
import {
    ResultMetric,
    ResultMetricsGrid,
    ResultPanel,
    ResultPrimary,
} from "@/components/ds/calculator-result"
import { Eyebrow } from "@/components/ds/eyebrow"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/money/decimal"
import type {
    PricingResult,
    ProductPricingResult,
    ServicePricingResult,
} from "@/lib/types/pricing"

interface PricingResultDisplayProps {
    result: PricingResult
}

export function PricingResultDisplay({ result }: PricingResultDisplayProps) {
    if (result.kind === "service") return <ServiceResult result={result} />
    return <ProductResult result={result} />
}

function ServiceResult({ result }: { result: ServicePricingResult }) {
    return (
        <ResultPanel>
            <ResultPrimary
                label="Required Hourly Rate"
                value={formatCurrency(result.requiredHourlyRate)}
                sublabel={`To hit your salary target over ${formatNumber(result.totalBillableHours)} billable hours`}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Break-Even Rate"
                    value={formatCurrency(result.breakEvenHourlyRate)}
                />
                <ResultMetric
                    label="Billable Hours / Year"
                    value={formatNumber(result.totalBillableHours)}
                />
                <ResultMetric
                    label="Revenue at Current"
                    value={formatCurrency(result.annualRevenueAtCurrent)}
                />
                <ResultMetric
                    label="Net Income at Current"
                    value={formatCurrency(result.netIncomeAtCurrent)}
                />
            </ResultMetricsGrid>

            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/30">
                <Eyebrow>Scenarios</Eyebrow>
                <dl className="flex flex-col gap-stack-sm">
                    {result.scenarios.map((s) => (
                        <div
                            key={s.name}
                            className="flex justify-between items-baseline py-2 border-b border-outline-variant/15 last:border-b-0"
                        >
                            <dt className="flex flex-col gap-0.5">
                                <span className="font-body-md text-body-md text-primary">
                                    {s.name}
                                </span>
                                <span className="font-body-md text-sm text-on-surface-variant">
                                    {formatCurrency(s.rate)}/hr
                                </span>
                            </dt>
                            <dd className="flex flex-col items-end gap-0.5">
                                <span className="font-body-md text-body-md text-on-background tabular-nums">
                                    {formatCurrency(s.annualRevenue)}
                                </span>
                                <span className="font-body-md text-sm text-on-surface-variant tabular-nums">
                                    Net {formatCurrency(s.netIncome)}
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </ResultPanel>
    )
}

function ProductResult({ result }: { result: ProductPricingResult }) {
    return (
        <ResultPanel>
            <ResultPrimary
                label="Recommended Selling Price"
                value={formatCurrency(result.sellingPrice)}
                sublabel={`${formatCurrency(result.profitPerUnit)} profit per unit · ${formatPercent(result.markupPercent, 1)} markup`}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Target Margin"
                    value={formatPercent(result.marginPercent, 1)}
                />
                <ResultMetric
                    label="Markup"
                    value={formatPercent(result.markupPercent, 1)}
                />
                <ResultMetric
                    label="With Shipping"
                    value={formatCurrency(result.priceWithShipping)}
                />
                <ResultMetric
                    label="Volume Price"
                    value={formatCurrency(result.volumePrice)}
                />
            </ResultMetricsGrid>

            {result.competitorComparison ? (
                <div className="flex flex-col gap-stack-sm pt-stack-md border-t border-outline-variant/30">
                    <Eyebrow>Versus Competitor</Eyebrow>
                    <p className="font-body-md text-body-md text-on-background">
                        Competitor at{" "}
                        <span className="text-primary">
                            {formatCurrency(result.competitorComparison.competitorPrice)}
                        </span>{" "}
                        — you&apos;re{" "}
                        <span className="text-primary">
                            {formatPercent(result.competitorComparison.differencePercent.abs(), 1)}{" "}
                            {result.competitorComparison.position}
                        </span>
                        .
                    </p>
                </div>
            ) : null}

            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/30">
                <Eyebrow>Strategies</Eyebrow>
                <dl className="flex flex-col">
                    {result.strategies.map((s) => (
                        <div
                            key={s.name}
                            className="flex justify-between items-baseline py-2 border-b border-outline-variant/15 last:border-b-0"
                        >
                            <dt className="flex flex-col gap-0.5">
                                <span className="font-body-md text-body-md text-primary">
                                    {s.name}
                                </span>
                                <span className="font-body-md text-sm text-on-surface-variant">
                                    {formatCurrency(s.price)}
                                </span>
                            </dt>
                            <dd className="flex flex-col items-end gap-0.5">
                                <span className="font-body-md text-body-md text-on-background tabular-nums">
                                    {formatCurrency(s.profit)}
                                </span>
                                <span className="font-body-md text-sm text-on-surface-variant tabular-nums">
                                    {formatPercent(s.marginPercent, 1)} margin
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </ResultPanel>
    )
}
