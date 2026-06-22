"use client"

import { FormField } from "@/components/ds/form-field"
import { Eyebrow } from "@/components/ds/eyebrow"
import type { BusinessFormState } from "@/lib/validators/tax"

interface BusinessFormProps {
    value: BusinessFormState
    onChange: (next: BusinessFormState) => void
    errors: Record<string, string>
}

export function BusinessForm({ value, onChange, errors }: BusinessFormProps) {
    const set = <K extends keyof BusinessFormState>(
        key: K,
        next: BusinessFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="flex flex-col gap-stack-xl">
            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>Income</Eyebrow>
                <FormField
                    id="businessIncome"
                    label="Annual Business Income ($)"
                    value={value.businessIncome}
                    onChange={(v) => set("businessIncome", v)}
                    placeholder="150000"
                    error={errors.businessIncome}
                />
            </div>

            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>Deductions</Eyebrow>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
                    <FormField
                        id="businessExpenses"
                        label="Business Expenses ($)"
                        value={value.businessExpenses}
                        onChange={(v) => set("businessExpenses", v)}
                        placeholder="25000"
                        error={errors.businessExpenses}
                    />
                    <FormField
                        id="homeOffice"
                        label="Home Office Deduction ($)"
                        value={value.homeOffice}
                        onChange={(v) => set("homeOffice", v)}
                        placeholder="5000"
                        error={errors.homeOffice}
                    />
                    <FormField
                        id="vehicleExpenses"
                        label="Vehicle / Travel ($)"
                        value={value.vehicleExpenses}
                        onChange={(v) => set("vehicleExpenses", v)}
                        placeholder="8000"
                        error={errors.vehicleExpenses}
                    />
                    <FormField
                        id="equipment"
                        label="Equipment / Depreciation ($)"
                        value={value.equipment}
                        onChange={(v) => set("equipment", v)}
                        placeholder="12000"
                        error={errors.equipment}
                    />
                </div>
            </div>
        </div>
    )
}
