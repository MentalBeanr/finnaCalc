"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { RoiMethod } from "@/lib/types/roi"
import type { RoiFormState } from "@/lib/validators/roi"
import { FormField, SelectFieldShell } from "@/components/ds/form-field"

interface RoiFormProps {
    value: RoiFormState
    onChange: (next: RoiFormState) => void
    errors: Record<string, string>
}

export function RoiForm({ value, onChange, errors }: RoiFormProps) {
    const set = <K extends keyof RoiFormState>(key: K, next: RoiFormState[K]) =>
        onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-2 gap-stack-lg">
            <SelectFieldShell id="method" label="Annualization Method">
                <Select
                    value={value.method}
                    onValueChange={(v) => set("method", v as RoiMethod)}
                >
                    <SelectTrigger id="method">
                        <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="simple">Simple (linear)</SelectItem>
                        <SelectItem value="annualized">CAGR (geometric)</SelectItem>
                    </SelectContent>
                </Select>
            </SelectFieldShell>

            <FormField
                id="timeYears"
                label="Time Period (years)"
                value={value.timeYears}
                onChange={(v) => set("timeYears", v)}
                placeholder="5"
                step="0.1"
                error={errors.timeYears}
            />
            <FormField
                id="initialInvestment"
                label="Initial Investment ($)"
                value={value.initialInvestment}
                onChange={(v) => set("initialInvestment", v)}
                placeholder="10000"
                error={errors.initialInvestment}
            />
            <FormField
                id="finalValue"
                label="Final Value ($)"
                value={value.finalValue}
                onChange={(v) => set("finalValue", v)}
                placeholder="15000"
                error={errors.finalValue}
            />
            <FormField
                id="dividendYieldPercent"
                label="Dividend / Income Yield (%)"
                value={value.dividendYieldPercent}
                onChange={(v) => set("dividendYieldPercent", v)}
                placeholder="0"
                step="0.01"
                error={errors.dividendYieldPercent}
            />
            <FormField
                id="taxRatePercent"
                label="Tax Rate on Gains (%)"
                value={value.taxRatePercent}
                onChange={(v) => set("taxRatePercent", v)}
                placeholder="20"
                step="0.01"
                error={errors.taxRatePercent}
            />
            <FormField
                id="inflationPercent"
                label="Inflation Rate (%)"
                value={value.inflationPercent}
                onChange={(v) => set("inflationPercent", v)}
                placeholder="3"
                step="0.01"
                error={errors.inflationPercent}
                className="col-span-2"
            />
        </div>
    )
}
