"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FormField, SelectFieldShell } from "@/components/ds/form-field"
import type { BusinessType } from "@/lib/types/break-even"
import type { BreakEvenFormState } from "@/lib/validators/break-even"

interface BreakEvenFormProps {
    value: BreakEvenFormState
    onChange: (next: BreakEvenFormState) => void
    errors: Record<string, string>
}

function unitNoun(type: BusinessType) {
    return type === "service" ? "Service" : "Unit"
}

export function BreakEvenForm({ value, onChange, errors }: BreakEvenFormProps) {
    const set = <K extends keyof BreakEvenFormState>(
        key: K,
        next: BreakEvenFormState[K],
    ) => onChange({ ...value, [key]: next })

    const unit = unitNoun(value.businessType)

    return (
        <div className="grid grid-cols-2 gap-stack-lg">
            <SelectFieldShell id="businessType" label="Business Type">
                <Select
                    value={value.businessType}
                    onValueChange={(v) => set("businessType", v as BusinessType)}
                >
                    <SelectTrigger id="businessType">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="single">Single Product</SelectItem>
                        <SelectItem value="multiple">Multiple Products</SelectItem>
                        <SelectItem value="service">Service Business</SelectItem>
                    </SelectContent>
                </Select>
            </SelectFieldShell>

            <FormField
                id="fixedCosts"
                label="Fixed Costs per Month ($)"
                value={value.fixedCosts}
                onChange={(v) => set("fixedCosts", v)}
                placeholder="10000"
                helperText="Rent, salaries, insurance — costs that don't vary with volume"
                error={errors.fixedCosts}
            />
            <FormField
                id="pricePerUnit"
                label={`Price per ${unit} ($)`}
                value={value.pricePerUnit}
                onChange={(v) => set("pricePerUnit", v)}
                placeholder="50"
                step="0.01"
                error={errors.pricePerUnit}
            />
            <FormField
                id="variableCostPerUnit"
                label={`Variable Cost per ${unit} ($)`}
                value={value.variableCostPerUnit}
                onChange={(v) => set("variableCostPerUnit", v)}
                placeholder="25"
                step="0.01"
                helperText={
                    value.businessType === "service"
                        ? "Direct cost per service delivered"
                        : "Materials and direct labor per unit"
                }
                error={errors.variableCostPerUnit}
            />

            <FormField
                id="targetProfitPercent"
                label="Target Profit Margin (%)"
                value={value.targetProfitPercent}
                onChange={(v) => set("targetProfitPercent", v)}
                placeholder="20"
                step="0.1"
                helperText="As a percent of fixed costs"
                error={errors.targetProfitPercent}
            />
            <FormField
                id="seasonalityPercent"
                label="Seasonality Adjustment (%)"
                value={value.seasonalityPercent}
                onChange={(v) => set("seasonalityPercent", v)}
                placeholder="0"
                step="1"
                helperText="Positive for peak season, negative for low season"
                error={errors.seasonalityPercent}
            />
        </div>
    )
}
