"use client"

import { Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    formatCurrency,
    formatNumber,
    formatPercent,
} from "@/lib/money/decimal"
import type { LoanResult } from "@/lib/types/loan"

interface ResultDisplayProps {
    result: LoanResult
}

const FREQUENCY_LABEL: Record<string, string> = {
    monthly: "monthly",
    biweekly: "bi-weekly",
    weekly: "weekly",
    quarterly: "quarterly",
    annually: "annual",
}

type Accent = "green" | "blue" | "red" | "purple" | "orange"

const ACCENT_CLASSES: Record<Accent, string> = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    purple: "text-purple-600 dark:text-purple-400",
    orange: "text-orange-600 dark:text-orange-400",
}

function Metric({ label, value, accent }: { label: string; value: string; accent: Accent }) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${ACCENT_CLASSES[accent]}`}>{value}</p>
        </div>
    )
}

export function FormErrorBanner({ message }: { message: string }) {
    return (
        <div className="text-red-600 dark:text-red-400 font-semibold p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
            {message}
        </div>
    )
}

export function ResultDisplay({ result }: ResultDisplayProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                Your{" "}
                {result.kind === "payment"
                    ? "Payment"
                    : result.kind === "apr"
                        ? "APR"
                        : result.kind === "loanAmount"
                            ? "Loan Amount"
                            : "Remaining Balance"}{" "}
                Calculation
            </h3>

            {result.kind === "payment" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Metric
                        label={`Payment (${FREQUENCY_LABEL[result.frequency] ?? result.frequency})`}
                        value={formatCurrency(result.paymentPerPeriod)}
                        accent="green"
                    />
                    <Metric label="Total Payment" value={formatCurrency(result.totalPayment)} accent="blue" />
                    <Metric label="Total Interest" value={formatCurrency(result.totalInterest)} accent="red" />
                    <Metric label="Principal Amount" value={formatCurrency(result.principal)} accent="purple" />
                </div>
            )}

            {result.kind === "apr" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Metric label="Annual Percentage Rate (APR)" value={formatPercent(result.apr)} accent="green" />
                    <Metric label="Total Cost of Loan" value={formatCurrency(result.totalCost)} accent="red" />
                </div>
            )}

            {result.kind === "loanAmount" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Metric
                        label="Maximum Loan Amount"
                        value={formatCurrency(result.maxLoanAmount)}
                        accent="green"
                    />
                    <Metric label="Monthly Payment" value={formatCurrency(result.monthlyPayment)} accent="blue" />
                </div>
            )}

            {result.kind === "remaining" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Metric
                        label="Remaining Balance"
                        value={formatCurrency(result.remainingBalance)}
                        accent="green"
                    />
                    <Metric
                        label="Remaining Payments"
                        value={formatNumber(result.remainingPayments)}
                        accent="blue"
                    />
                    <Metric label="Total Paid So Far" value={formatCurrency(result.totalPaid)} accent="purple" />
                    <Metric label="Monthly Payment" value={formatCurrency(result.monthlyPayment)} accent="orange" />
                </div>
            )}

            <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent" disabled>
                    <Share2 className="h-4 w-4" />
                    Share Results
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent" disabled>
                    <Download className="h-4 w-4" />
                    Download Report
                </Button>
            </div>
        </div>
    )
}
