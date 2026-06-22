"use client"

import { FormField } from "@/components/ds/form-field"
import type { CashFlowFormState } from "@/lib/validators/cash-flow"

interface CashFlowFormProps {
    value: CashFlowFormState
    onChange: (next: CashFlowFormState) => void
    errors: Record<string, string>
}

export function CashFlowForm({ value, onChange, errors }: CashFlowFormProps) {
    const set = <K extends keyof CashFlowFormState>(
        key: K,
        next: CashFlowFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
            <FormField
                id="monthlyRevenue"
                label="Monthly Revenue ($)"
                value={value.monthlyRevenue}
                onChange={(v) => set("monthlyRevenue", v)}
                placeholder="25000"
                helperText="Revenue in month 1; future months scale by growth"
                error={errors.monthlyRevenue}
            />
            <FormField
                id="monthlyExpenses"
                label="Monthly Expenses ($)"
                value={value.monthlyExpenses}
                onChange={(v) => set("monthlyExpenses", v)}
                placeholder="20000"
                helperText="Held constant across the projection"
                error={errors.monthlyExpenses}
            />
            <FormField
                id="startingCash"
                label="Starting Cash Balance ($)"
                value={value.startingCash}
                onChange={(v) => set("startingCash", v)}
                placeholder="50000"
                error={errors.startingCash}
            />
            <FormField
                id="monthlyGrowthPercent"
                label="Monthly Revenue Growth (%)"
                value={value.monthlyGrowthPercent}
                onChange={(v) => set("monthlyGrowthPercent", v)}
                placeholder="5"
                step="0.1"
                helperText="Can be negative for declining revenue"
                error={errors.monthlyGrowthPercent}
            />
            <FormField
                id="months"
                label="Projection Horizon (months)"
                value={value.months}
                onChange={(v) => set("months", v)}
                placeholder="12"
                helperText="Up to 120 months (10 years)"
                error={errors.months}
                className="md:col-span-2"
            />
        </div>
    )
}
