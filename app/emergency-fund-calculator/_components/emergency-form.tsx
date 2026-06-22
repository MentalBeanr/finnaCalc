"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FormField, SelectFieldShell } from "@/components/ds/form-field"
import type { EmergencyTargetType } from "@/lib/types/emergency"
import type { EmergencyFormState } from "@/lib/validators/emergency"

interface EmergencyFormProps {
    value: EmergencyFormState
    onChange: (next: EmergencyFormState) => void
    errors: Record<string, string>
}

export function EmergencyForm({ value, onChange, errors }: EmergencyFormProps) {
    const set = <K extends keyof EmergencyFormState>(
        key: K,
        next: EmergencyFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
            <FormField
                id="monthlyExpenses"
                label="Monthly Expenses ($)"
                value={value.monthlyExpenses}
                onChange={(v) => set("monthlyExpenses", v)}
                placeholder="5000"
                error={errors.monthlyExpenses}
            />
            <FormField
                id="currentSavings"
                label="Current Emergency Savings ($)"
                value={value.currentSavings}
                onChange={(v) => set("currentSavings", v)}
                placeholder="10000"
                error={errors.currentSavings}
            />

            <SelectFieldShell id="targetType" label="Target Type">
                <Select
                    value={value.targetType}
                    onValueChange={(v) =>
                        set("targetType", v as EmergencyTargetType)
                    }
                >
                    <SelectTrigger id="targetType">
                        <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="months">Months of Expenses</SelectItem>
                        <SelectItem value="amount">Dollar Amount</SelectItem>
                    </SelectContent>
                </Select>
            </SelectFieldShell>

            <FormField
                id="targetValue"
                label={
                    value.targetType === "months"
                        ? "Number of Months"
                        : "Target Amount ($)"
                }
                value={value.targetValue}
                onChange={(v) => set("targetValue", v)}
                placeholder={value.targetType === "months" ? "6" : "30000"}
                helperText={
                    value.targetType === "months"
                        ? "Most planners recommend 3–6 months"
                        : "Your desired fund size in dollars"
                }
                error={errors.targetValue}
            />

            <FormField
                id="monthlyContribution"
                label="Monthly Contribution ($)"
                value={value.monthlyContribution}
                onChange={(v) => set("monthlyContribution", v)}
                placeholder="500"
                error={errors.monthlyContribution}
            />
            <FormField
                id="annualRatePercent"
                label="Account Interest Rate (%)"
                value={value.annualRatePercent}
                onChange={(v) => set("annualRatePercent", v)}
                placeholder="4.5"
                step="0.01"
                error={errors.annualRatePercent}
            />
        </div>
    )
}
