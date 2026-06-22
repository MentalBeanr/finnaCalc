"use client"

import type { RemainingFormState } from "@/lib/validators/loan"
import { FormField } from "./form-field"

interface RemainingFormProps {
    value: RemainingFormState
    onChange: (next: RemainingFormState) => void
    errors: Record<string, string>
}

export function RemainingForm({ value, onChange, errors }: RemainingFormProps) {
    const set = <K extends keyof RemainingFormState>(key: K, next: RemainingFormState[K]) =>
        onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-2 gap-stack-lg">
            <FormField
                id="originalAmount"
                label="Original Loan Amount ($)"
                value={value.originalAmount}
                onChange={(v) => set("originalAmount", v)}
                placeholder="50000"
                error={errors.originalAmount}
            />
            <FormField
                id="originalRate"
                label="Annual Interest Rate (%)"
                value={value.interestRate}
                onChange={(v) => set("interestRate", v)}
                placeholder="5.5"
                step="0.01"
                error={errors.interestRate}
            />
            <FormField
                id="originalTerm"
                label="Original Term (months)"
                value={value.termMonths}
                onChange={(v) => set("termMonths", v)}
                placeholder="60"
                error={errors.termMonths}
            />
            <FormField
                id="paymentsMade"
                label="Payments Made"
                value={value.paymentsMade}
                onChange={(v) => set("paymentsMade", v)}
                placeholder="12"
                error={errors.paymentsMade}
            />
        </div>
    )
}
