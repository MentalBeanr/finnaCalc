import { z } from "zod"
import { Decimal, parseAmount } from "@/lib/money/decimal"
import type {
    AprInput,
    LoanAmountInput,
    PaymentFrequency,
    PaymentInput,
    RemainingBalanceInput,
} from "@/lib/types/loan"

const frequencyEnum = z.enum([
    "monthly",
    "biweekly",
    "weekly",
    "quarterly",
    "annually",
])

const decimalField = (label: string, options: { min?: number; allowZero?: boolean } = {}) =>
    z
        .string()
        .transform((raw, ctx) => {
            const parsed = parseAmount(raw)
            if (parsed === null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `${label} must be a valid number.`,
                })
                return z.NEVER
            }
            const min = options.min ?? 0
            if (options.allowZero === false ? parsed.lte(min) : parsed.lt(min)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `${label} must be ${options.allowZero === false ? "greater than" : "at least"} ${min}.`,
                })
                return z.NEVER
            }
            return parsed
        })

const paymentSchema = z.object({
    loanAmount: decimalField("Loan amount", { allowZero: false }),
    interestRate: decimalField("Interest rate"),
    termMonths: decimalField("Term", { allowZero: false }),
    downPayment: decimalField("Down payment"),
    frequency: frequencyEnum,
}).refine(
    (data) => data.loanAmount.gt(data.downPayment),
    { message: "Down payment must be less than loan amount.", path: ["downPayment"] },
)

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

const remainingSchema = z.object({
    originalAmount: decimalField("Original loan amount", { allowZero: false }),
    interestRate: decimalField("Interest rate"),
    termMonths: decimalField("Term", { allowZero: false }),
    paymentsMade: decimalField("Payments made"),
}).refine(
    (data) => data.paymentsMade.lte(data.termMonths),
    { message: "Payments made cannot exceed loan term.", path: ["paymentsMade"] },
)

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

export type ValidationResult<T> =
    | { ok: true; data: T }
    | { ok: false; errors: Record<string, string> }

function flattenErrors(error: z.ZodError): Record<string, string> {
    const out: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join(".") || "_form"
        if (!out[key]) out[key] = issue.message
    }
    return out
}

function runSchema<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, raw: unknown): ValidationResult<T> {
    const parsed = schema.safeParse(raw)
    if (parsed.success) return { ok: true, data: parsed.data }
    return { ok: false, errors: flattenErrors(parsed.error) }
}

export function validatePaymentInput(raw: PaymentFormState): ValidationResult<PaymentInput> {
    return runSchema<PaymentInput>(paymentSchema as unknown as z.ZodType<PaymentInput, z.ZodTypeDef, unknown>, raw)
}

export function validateAprInput(raw: AprFormState): ValidationResult<AprInput> {
    return runSchema<AprInput>(aprSchema as unknown as z.ZodType<AprInput, z.ZodTypeDef, unknown>, raw)
}

export function validateLoanAmountInput(raw: LoanAmountFormState): ValidationResult<LoanAmountInput> {
    return runSchema<LoanAmountInput>(loanAmountSchema as unknown as z.ZodType<LoanAmountInput, z.ZodTypeDef, unknown>, raw)
}

export function validateRemainingInput(raw: RemainingFormState): ValidationResult<RemainingBalanceInput> {
    return runSchema<RemainingBalanceInput>(remainingSchema as unknown as z.ZodType<RemainingBalanceInput, z.ZodTypeDef, unknown>, raw)
}

export type { Decimal }
