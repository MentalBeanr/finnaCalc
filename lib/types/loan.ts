import type { Decimal } from "@/lib/money/decimal"

export type PaymentFrequency =
    | "monthly"
    | "biweekly"
    | "weekly"
    | "quarterly"
    | "annually"

export type LoanType =
    | "personal"
    | "business"
    | "auto"
    | "mortgage"
    | "student"

export interface PaymentInput {
    loanAmount: Decimal
    interestRate: Decimal
    termMonths: Decimal
    downPayment: Decimal
    frequency: PaymentFrequency
}

export interface PaymentResult {
    kind: "payment"
    paymentPerPeriod: Decimal
    totalPayment: Decimal
    totalInterest: Decimal
    principal: Decimal
    downPayment: Decimal
    frequency: PaymentFrequency
    periods: Decimal
}

export interface AprInput {
    loanAmount: Decimal
    totalInterest: Decimal
    fees: Decimal
    termYears: Decimal
}

export interface AprResult {
    kind: "apr"
    apr: Decimal
    totalCost: Decimal
    principal: Decimal
    termYears: Decimal
}

export interface LoanAmountInput {
    monthlyPayment: Decimal
    interestRate: Decimal
    termMonths: Decimal
}

export interface LoanAmountResult {
    kind: "loanAmount"
    maxLoanAmount: Decimal
    monthlyPayment: Decimal
    interestRate: Decimal
    termMonths: Decimal
}

export interface RemainingBalanceInput {
    originalAmount: Decimal
    interestRate: Decimal
    termMonths: Decimal
    paymentsMade: Decimal
}

export interface RemainingBalanceResult {
    kind: "remaining"
    remainingBalance: Decimal
    remainingPayments: Decimal
    monthlyPayment: Decimal
    totalPaid: Decimal
}

export type LoanResult =
    | PaymentResult
    | AprResult
    | LoanAmountResult
    | RemainingBalanceResult

export type CalculationMode = LoanResult["kind"]

export const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
    monthly: 12,
    biweekly: 26,
    weekly: 52,
    quarterly: 4,
    annually: 1,
}
