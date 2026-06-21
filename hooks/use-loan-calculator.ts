"use client"

import { useCallback, useMemo, useState } from "react"
import {
    calculateApr,
    calculateMaxLoanAmount,
    calculatePayment,
    calculateRemainingBalance,
} from "@/lib/calculations/loan"
import type {
    CalculationMode,
    LoanResult,
    LoanType,
} from "@/lib/types/loan"
import {
    type AprFormState,
    type LoanAmountFormState,
    type PaymentFormState,
    type RemainingFormState,
    type ValidationResult,
    validateAprInput,
    validateLoanAmountInput,
    validatePaymentInput,
    validateRemainingInput,
} from "@/lib/validators/loan"

const INITIAL_PAYMENT: PaymentFormState = {
    loanAmount: "",
    interestRate: "",
    termMonths: "",
    downPayment: "",
    frequency: "monthly",
}

const INITIAL_APR: AprFormState = {
    loanAmount: "",
    totalInterest: "",
    fees: "",
    termYears: "",
}

const INITIAL_LOAN_AMOUNT: LoanAmountFormState = {
    monthlyPayment: "",
    interestRate: "",
    termMonths: "",
}

const INITIAL_REMAINING: RemainingFormState = {
    originalAmount: "",
    interestRate: "",
    termMonths: "",
    paymentsMade: "",
}

export interface UseLoanCalculator {
    mode: CalculationMode
    setMode: (mode: CalculationMode) => void
    loanType: LoanType
    setLoanType: (type: LoanType) => void
    payment: PaymentFormState
    setPayment: (next: PaymentFormState) => void
    apr: AprFormState
    setApr: (next: AprFormState) => void
    loanAmount: LoanAmountFormState
    setLoanAmount: (next: LoanAmountFormState) => void
    remaining: RemainingFormState
    setRemaining: (next: RemainingFormState) => void
    result: LoanResult | null
    errors: Record<string, string>
    calculate: () => void
    reset: () => void
}

function runValidation<TForm, TInput, TResult extends LoanResult>(
    validate: (form: TForm) => ValidationResult<TInput>,
    calc: (input: TInput) => TResult,
    form: TForm,
): { result: LoanResult | null; errors: Record<string, string> } {
    const validated = validate(form)
    if (!validated.ok) return { result: null, errors: validated.errors }
    return { result: calc(validated.data), errors: {} }
}

export function useLoanCalculator(): UseLoanCalculator {
    const [mode, setMode] = useState<CalculationMode>("payment")
    const [loanType, setLoanType] = useState<LoanType>("personal")

    const [payment, setPayment] = useState<PaymentFormState>(INITIAL_PAYMENT)
    const [apr, setApr] = useState<AprFormState>(INITIAL_APR)
    const [loanAmount, setLoanAmount] = useState<LoanAmountFormState>(INITIAL_LOAN_AMOUNT)
    const [remaining, setRemaining] = useState<RemainingFormState>(INITIAL_REMAINING)

    const [result, setResult] = useState<LoanResult | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const changeMode = useCallback((next: CalculationMode) => {
        setMode(next)
        setResult(null)
        setErrors({})
    }, [])

    const calculate = useCallback(() => {
        let computed: { result: LoanResult | null; errors: Record<string, string> }
        switch (mode) {
            case "payment":
                computed = runValidation(validatePaymentInput, calculatePayment, payment)
                break
            case "apr":
                computed = runValidation(validateAprInput, calculateApr, apr)
                break
            case "loanAmount":
                computed = runValidation(validateLoanAmountInput, calculateMaxLoanAmount, loanAmount)
                break
            case "remaining":
                computed = runValidation(validateRemainingInput, calculateRemainingBalance, remaining)
                break
        }
        setErrors(computed.errors)
        setResult(computed.result)
    }, [mode, payment, apr, loanAmount, remaining])

    const reset = useCallback(() => {
        setPayment(INITIAL_PAYMENT)
        setApr(INITIAL_APR)
        setLoanAmount(INITIAL_LOAN_AMOUNT)
        setRemaining(INITIAL_REMAINING)
        setResult(null)
        setErrors({})
    }, [])

    return useMemo<UseLoanCalculator>(
        () => ({
            mode,
            setMode: changeMode,
            loanType,
            setLoanType,
            payment,
            setPayment,
            apr,
            setApr,
            loanAmount,
            setLoanAmount,
            remaining,
            setRemaining,
            result,
            errors,
            calculate,
            reset,
        }),
        [mode, changeMode, loanType, payment, apr, loanAmount, remaining, result, errors, calculate, reset],
    )
}
