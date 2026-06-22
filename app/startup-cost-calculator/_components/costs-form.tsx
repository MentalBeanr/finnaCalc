"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
    FormField,
    SelectFieldShell,
} from "@/components/ds/form-field"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"
import type { StartupBusinessType } from "@/lib/types/startup-cost"
import type { StartupCostFormState } from "@/lib/validators/startup-cost"

interface CostsFormProps {
    value: StartupCostFormState
    onChange: (next: StartupCostFormState) => void
    errors: Record<string, string>
    businessType: StartupBusinessType | ""
    onBusinessTypeChange: (next: StartupBusinessType | "") => void
    onLoadTemplate: () => void
}

const COST_FIELDS: ReadonlyArray<{
    id: keyof StartupCostFormState
    label: string
    placeholder: string
}> = [
    { id: "equipment", label: "Equipment & Technology ($)", placeholder: "15000" },
    { id: "inventory", label: "Initial Inventory ($)", placeholder: "10000" },
    { id: "marketing", label: "Marketing ($)", placeholder: "5000" },
    { id: "legal", label: "Legal & Professional ($)", placeholder: "3000" },
    { id: "rent", label: "First 3 Months Rent ($)", placeholder: "9000" },
    { id: "utilities", label: "Utilities Setup ($)", placeholder: "1500" },
    { id: "insurance", label: "Insurance ($)", placeholder: "2400" },
    { id: "permits", label: "Permits & Licenses ($)", placeholder: "1500" },
    { id: "website", label: "Website & Digital ($)", placeholder: "3000" },
    { id: "employees", label: "Employee Setup ($)", placeholder: "2000" },
    { id: "salaries", label: "First 3 Months Salaries ($)", placeholder: "15000" },
    { id: "workingCapital", label: "Working Capital ($)", placeholder: "10000" },
    { id: "other", label: "Other Expenses ($)", placeholder: "2000" },
]

export function CostsForm({
    value,
    onChange,
    errors,
    businessType,
    onBusinessTypeChange,
    onLoadTemplate,
}: CostsFormProps) {
    const set = <K extends keyof StartupCostFormState>(
        key: K,
        next: StartupCostFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="flex flex-col gap-stack-xl">
            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>Quick Start</Eyebrow>
                <div className="flex items-end gap-stack-md">
                    <SelectFieldShell
                        id="businessType"
                        label="Business Type"
                        className="flex-1"
                    >
                        <Select
                            value={businessType || undefined}
                            onValueChange={(v) =>
                                onBusinessTypeChange(v as StartupBusinessType)
                            }
                        >
                            <SelectTrigger id="businessType">
                                <SelectValue placeholder="Choose a template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="retail">Retail Store</SelectItem>
                                <SelectItem value="restaurant">Restaurant</SelectItem>
                                <SelectItem value="service">Service Business</SelectItem>
                                <SelectItem value="online">Online Business</SelectItem>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="consulting">Consulting</SelectItem>
                            </SelectContent>
                        </Select>
                    </SelectFieldShell>
                    <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={onLoadTemplate}
                        disabled={!businessType}
                    >
                        <MaterialIcon name="download" size={16} />
                        Load Template
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>Cost Categories</Eyebrow>
                <div className="grid grid-cols-2 gap-stack-lg">
                    {COST_FIELDS.map((field) => (
                        <FormField
                            key={field.id}
                            id={field.id}
                            label={field.label}
                            value={value[field.id]}
                            onChange={(v) => set(field.id, v)}
                            placeholder={field.placeholder}
                            error={errors[field.id]}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>Contingency</Eyebrow>
                <FormField
                    id="bufferPercent"
                    label="Buffer (% of total costs)"
                    value={value.bufferPercent}
                    onChange={(v) => set("bufferPercent", v)}
                    placeholder="20"
                    step="1"
                    helperText="Adds a cushion on top of the line-item total"
                    error={errors.bufferPercent}
                    className="col-span-2"
                />
            </div>
        </div>
    )
}
