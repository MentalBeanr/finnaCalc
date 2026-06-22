import { z } from "zod"
import { Decimal } from "@/lib/money/decimal"
import type {
    AprInput,
    LoanAmountInput,
    PaymentFrequency,
    PaymentInput,
    RemainingBalanceInput,
} from "@/lib/types/loan"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const frequencyEnum = z.enum([
    "monthly",
    "biweekly",
    "weekly",
    "quarterly",
    "annually",
])

const paymentSchema = z
    .object({
        loanAmount: decimalField("Loan amount", { allowZero: false }),
        interestRate: decimalField("Interest rate"),
        termMonths: decimalField("Term", { allowZero: false }),
        downPayment: decimalField("Down payment"),
        frequency: frequencyEnum,
    })
    .refine((data) => data.loanAmount.gt(data.downPayment), {
        message: "Down payment must be less than loan amount.",
        path: ["downPayment"],
    })

const aprSchema = z.object({
    loanAmount: decimalField("Loan amount", { allowZero: false }),
    totalInterest: decimalField("Total interest"),
    fees: decimalField("Fees"),
    termYears: decimalField("Term", { allowZero: false }),
})

const loanAmountSchema = z.object({
    monthlyPayment: decimalField("Monthly payment", { allowZero: false }),
    interestRate: decimalField("Interest rate"),
    termMonths: decimalField("Term", { allowZero: false }),
})

const remainingSchema = z
    .object({
        originalAmount: decimalField("Original loan amount", { allowZero: false }),
        interestRate: decimalField("Interest rate"),
        termMonths: decimalField("Term", { allowZero: false }),
        paymentsMade: decimalField("Payments made"),
    })
    .refine((data) => data.paymentsMade.lte(data.termMonths), {
        message: "Payments made cannot exceed loan term.",
        path: ["paymentsMade"],
    })

export type PaymentFormState = {
    loanAmount: string
    interestRate: string
    termMonths: string
    downPayment: string
    frequency: PaymentFrequency
}

export type AprFormState = {
    loanAmount: string
    totalInterest: string
    fees: string
    termYears: string
}

export type LoanAmountFormState = {
    monthlyPayment: string
    interestRate: string
    termMonths: string
}

export type RemainingFormState = {
    originalAmount: string
    interestRate: string
    termMonths: string
    paymentsMade: string
}

export type { ValidationResult }

export function validatePaymentInput(raw: PaymentFormState): ValidationResult<PaymentInput> {
    return runSchema<PaymentInput>(
        paymentSchema as unknown as z.ZodType<PaymentInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export function validateAprInput(raw: AprFormState): ValidationResult<AprInput> {
    return runSchema<AprInput>(
        aprSchema as unknown as z.ZodType<AprInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export function validateLoanAmountInput(
    raw: LoanAmountFormState,
): ValidationResult<LoanAmountInput> {
    return runSchema<LoanAmountInput>(
        loanAmountSchema as unknown as z.ZodType<LoanAmountInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export function validateRemainingInput(
    raw: RemainingFormState,
): ValidationResult<RemainingBalanceInput> {
    return runSchema<RemainingBalanceInput>(
        remainingSchema as unknown as z.ZodType<RemainingBalanceInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
