"use client"

import { FormField } from "@/components/ds/form-field"
import type { ProfitMarginFormState } from "@/lib/validators/profit-margin"

interface ProfitMarginFormProps {
    value: ProfitMarginFormState
    onChange: (next: ProfitMarginFormState) => void
    errors: Record<string, string>
}

export function ProfitMarginForm({ value, onChange, errors }: ProfitMarginFormProps) {
    const set = <K extends keyof ProfitMarginFormState>(
        key: K,
        next: ProfitMarginFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-2 gap-stack-lg">
            <FormField
                id="revenue"
                label="Total Revenue ($)"
                value={value.revenue}
                onChange={(v) => set("revenue", v)}
                placeholder="100000"
                helperText="Total sales for the period"
                error={errors.revenue}
                className="col-span-2"
            />
            <FormField
                id="costOfGoodsSold"
                label="Cost of Goods Sold ($)"
                value={value.costOfGoodsSold}
                onChange={(v) => set("costOfGoodsSold", v)}
                placeholder="60000"
                helperText="Direct costs to produce or deliver"
                error={errors.costOfGoodsSold}
            />
            <FormField
                id="operatingExpenses"
                label="Operating Expenses ($)"
                value={value.operatingExpenses}
                onChange={(v) => set("operatingExpenses", v)}
                placeholder="25000"
                helperText="Rent, salaries, marketing, overhead"
                error={errors.operatingExpenses}
            />
            <FormField
                id="taxRatePercent"
                label="Effective Tax Rate (%)"
                value={value.taxRatePercent}
                onChange={(v) => set("taxRatePercent", v)}
                placeholder="21"
                step="0.1"
                helperText="Set to 0 to skip taxes"
                error={errors.taxRatePercent}
                className="col-span-2"
            />
        </div>
    )
}
