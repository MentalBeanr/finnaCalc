"use client"

import type { AprFormState } from "@/lib/validators/loan"
import { FormField } from "./form-field"

interface AprFormProps {
    value: AprFormState
    onChange: (next: AprFormState) => void
    errors: Record<string, string>
}

export function AprForm({ value, onChange, errors }: AprFormProps) {
    const set = <K extends keyof AprFormState>(key: K, next: AprFormState[K]) =>
        onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-2 gap-stack-lg">
            <FormField
                id="aprLoanAmount"
                label="Loan Amount ($)"
                value={value.loanAmount}
                onChange={(v) => set("loanAmount", v)}
                placeholder="50000"
                error={errors.loanAmount}
            />
            <FormField
                id="totalInterest"
                label="Total Interest Paid ($)"
                value={value.totalInterest}
                onChange={(v) => set("totalInterest", v)}
                placeholder="5000"
                error={errors.totalInterest}
            />
            <FormField
                id="fees"
                label="Total Fees ($)"
                value={value.fees}
                onChange={(v) => set("fees", v)}
                placeholder="500"
                error={errors.fees}
            />
            <FormField
                id="termYears"
                label="Loan Term (years)"
                value={value.termYears}
                onChange={(v) => set("termYears", v)}
                placeholder="5"
                error={errors.termYears}
            />
        </div>
    )
}
