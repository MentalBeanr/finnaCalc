"use client"

import { FormField } from "@/components/ds/form-field"
import type { ServicePricingFormState } from "@/lib/validators/pricing"

interface ServiceFormProps {
    value: ServicePricingFormState
    onChange: (next: ServicePricingFormState) => void
    errors: Record<string, string>
}

export function ServiceForm({ value, onChange, errors }: ServiceFormProps) {
    const set = <K extends keyof ServicePricingFormState>(
        key: K,
        next: ServicePricingFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-2 gap-stack-lg">
            <FormField
                id="currentHourlyRate"
                label="Current Hourly Rate ($)"
                value={value.currentHourlyRate}
                onChange={(v) => set("currentHourlyRate", v)}
                placeholder="100"
                step="0.01"
                helperText="What you charge today"
                error={errors.currentHourlyRate}
            />
            <FormField
                id="desiredSalary"
                label="Desired Annual Salary ($)"
                value={value.desiredSalary}
                onChange={(v) => set("desiredSalary", v)}
                placeholder="80000"
                helperText="Take-home pay after expenses and taxes"
                error={errors.desiredSalary}
            />
            <FormField
                id="billableHoursPerWeek"
                label="Billable Hours per Week"
                value={value.billableHoursPerWeek}
                onChange={(v) => set("billableHoursPerWeek", v)}
                placeholder="30"
                error={errors.billableHoursPerWeek}
            />
            <FormField
                id="weeksPerYear"
                label="Working Weeks per Year"
                value={value.weeksPerYear}
                onChange={(v) => set("weeksPerYear", v)}
                placeholder="50"
                helperText="Subtract holidays and PTO"
                error={errors.weeksPerYear}
            />
            <FormField
                id="annualExpenses"
                label="Annual Business Expenses ($)"
                value={value.annualExpenses}
                onChange={(v) => set("annualExpenses", v)}
                placeholder="25000"
                helperText="Software, insurance, overhead"
                error={errors.annualExpenses}
            />
            <FormField
                id="taxRatePercent"
                label="Effective Tax Rate (%)"
                value={value.taxRatePercent}
                onChange={(v) => set("taxRatePercent", v)}
                placeholder="25"
                step="0.1"
                error={errors.taxRatePercent}
            />
        </div>
    )
}
