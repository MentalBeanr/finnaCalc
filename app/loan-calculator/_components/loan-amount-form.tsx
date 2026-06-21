"use client"

import type { LoanAmountFormState } from "@/lib/validators/loan"
import { FormField } from "./form-field"

interface LoanAmountFormProps {
    value: LoanAmountFormState
    onChange: (next: LoanAmountFormState) => void
    errors: Record<string, string>
}

export function LoanAmountForm({ value, onChange, errors }: LoanAmountFormProps) {
    const set = <K extends keyof LoanAmountFormState>(key: K, next: LoanAmountFormState[K]) =>
        onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                id="monthlyPayment"
                label="Monthly Payment ($)"
                value={value.monthlyPayment}
                onChange={(v) => set("monthlyPayment", v)}
                placeholder="500"
                error={errors.monthlyPayment}
            />
            <FormField
                id="rateForAmount"
                label="Annual Interest Rate (%)"
                value={value.interestRate}
                onChange={(v) => set("interestRate", v)}
                placeholder="5.5"
                step="0.01"
                error={errors.interestRate}
            />
            <FormField
                id="termForAmount"
                label="Loan Term (months)"
                value={value.termMonths}
                onChange={(v) => set("termMonths", v)}
                placeholder="60"
                error={errors.termMonths}
            />
        </div>
    )
}
