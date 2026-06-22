"use client"

import {
    ResultMetric,
    ResultMetricsGrid,
    ResultPanel,
    ResultPrimary,
} from "@/components/ds/calculator-result"
import {
    formatCurrency,
    formatNumber,
    formatPercent,
} from "@/lib/money/decimal"
import type { LoanResult, PaymentFrequency } from "@/lib/types/loan"

interface ResultDisplayProps {
    result: LoanResult
}

const FREQUENCY_LABEL: Record<PaymentFrequency, string> = {
    monthly: "monthly payment",
    biweekly: "bi-weekly payment",
    weekly: "weekly payment",
    quarterly: "quarterly payment",
    annually: "annual payment",
}

export function ResultDisplay({ result }: ResultDisplayProps) {
    if (result.kind === "payment") {
        return (
            <ResultPanel>
                <ResultPrimary
                    label={FREQUENCY_LABEL[result.frequency]}
                    value={formatCurrency(result.paymentPerPeriod)}
                    sublabel={`Over ${formatNumber(result.periods)} payments`}
                />
                <ResultMetricsGrid>
                    <ResultMetric
                        label="Total Payment"
                        value={formatCurrency(result.totalPayment)}
                    />
                    <ResultMetric
                        label="Total Interest"
                        value={formatCurrency(result.totalInterest)}
                    />
                    <ResultMetric
                        label="Principal"
                        value={formatCurrency(result.principal)}
                    />
                    <ResultMetric
                        label="Down Payment"
                        value={formatCurrency(result.downPayment)}
                    />
                </ResultMetricsGrid>
            </ResultPanel>
        )
    }

    if (result.kind === "apr") {
        return (
            <ResultPanel>
                <ResultPrimary
                    label="Annual Percentage Rate"
                    value={formatPercent(result.apr)}
                    sublabel="Simple-interest approximation"
                />
                <ResultMetricsGrid>
                    <ResultMetric
                        label="Total Cost"
                        value={formatCurrency(result.totalCost)}
                    />
                    <ResultMetric
                        label="Principal"
                        value={formatCurrency(result.principal)}
                    />
                </ResultMetricsGrid>
            </ResultPanel>
        )
    }

    if (result.kind === "loanAmount") {
        return (
            <ResultPanel>
                <ResultPrimary
                    label="Maximum Loan Amount"
                    value={formatCurrency(result.maxLoanAmount)}
                    sublabel="At your stated payment and rate"
                />
                <ResultMetricsGrid>
                    <ResultMetric
                        label="Monthly Payment"
                        value={formatCurrency(result.monthlyPayment)}
                    />
                    <ResultMetric
                        label="Term"
                        value={`${formatNumber(result.termMonths)} months`}
                    />
                </ResultMetricsGrid>
            </ResultPanel>
        )
    }

    return (
        <ResultPanel>
            <ResultPrimary
                label="Remaining Balance"
                value={formatCurrency(result.remainingBalance)}
                sublabel={`${formatNumber(result.remainingPayments)} payments remaining`}
            />
            <ResultMetricsGrid>
                <ResultMetric
                    label="Monthly Payment"
                    value={formatCurrency(result.monthlyPayment)}
                />
                <ResultMetric
                    label="Total Paid"
                    value={formatCurrency(result.totalPaid)}
                />
            </ResultMetricsGrid>
        </ResultPanel>
    )
}
