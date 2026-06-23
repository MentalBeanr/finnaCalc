"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    CheckboxFieldRow,
    FormField,
    SelectFieldShell,
} from "@/components/ds/form-field"
import { Eyebrow } from "@/components/ds/eyebrow"
import type { BudgetFrequency, BudgetItemType, BudgetType } from "@/lib/types/budget"
import { BUSINESS_CATEGORIES, PERSONAL_CATEGORIES } from "@/lib/types/budget"
import type { ItemFormState } from "@/lib/validators/budget"

interface AddItemFormProps {
    value: ItemFormState
    onChange: (next: ItemFormState) => void
    onSubmit: () => void
    onCancel?: () => void
    budgetType: BudgetType
    editing: boolean
    errors: Record<string, string>
}

export function AddItemForm({
    value,
    onChange,
    onSubmit,
    onCancel,
    budgetType,
    editing,
    errors,
}: AddItemFormProps) {
    const categories =
        budgetType === "personal" ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES
    const set = <K extends keyof ItemFormState>(key: K, next: ItemFormState[K]) =>
        onChange({ ...value, [key]: next })

    return (
        <div className="flex flex-col gap-stack-lg p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest">
            <Eyebrow>{editing ? "Edit Item" : "Add Item"}</Eyebrow>
            <div className="grid grid-cols-2 gap-stack-lg">
                <SelectFieldShell id="type" label="Type">
                    <Select
                        value={value.type}
                        onValueChange={(v) =>
                            onChange({
                                ...value,
                                type: v as BudgetItemType,
                                category: "",
                            })
                        }
                    >
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                </SelectFieldShell>

                <SelectFieldShell id="frequency" label="Frequency">
                    <Select
                        value={value.frequency}
                        onValueChange={(v) => set("frequency", v as BudgetFrequency)}
                    >
                        <SelectTrigger id="frequency">
                            <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                    </Select>
                </SelectFieldShell>

                <SelectFieldShell
                    id="category"
                    label="Category"
                    className="col-span-2"
                    error={errors.category}
                >
                    <Select
                        value={value.category}
                        onValueChange={(v) => set("category", v)}
                    >
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories[value.type].map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </SelectFieldShell>

                <FormField
                    id="subcategory"
                    label="Description"
                    value={value.subcategory}
                    onChange={(v) => set("subcategory", v)}
                    placeholder="e.g. Rent, Netflix, Groceries"
                    type="text"
                    inputMode="text"
                    className="col-span-2"
                />

                <FormField
                    id="amount"
                    label="Amount ($)"
                    value={value.amount}
                    onChange={(v) => set("amount", v)}
                    placeholder="0.00"
                    step="0.01"
                    error={errors.amount}
                    className="col-span-2"
                />

                <CheckboxFieldRow
                    id="isFixed"
                    label="Fixed amount"
                    description="Doesn't vary month to month"
                    className="col-span-2"
                >
                    <Checkbox
                        id="isFixed"
                        checked={value.isFixed}
                        onCheckedChange={(checked) => set("isFixed", Boolean(checked))}
                    />
                </CheckboxFieldRow>
            </div>

            <div className="flex gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {editing && onCancel ? (
                    <Button variant="outline" onClick={onCancel} className="flex-1">
                        Cancel
                    </Button>
                ) : null}
                <Button onClick={onSubmit} className="flex-1">
                    {editing ? "Update Item" : "Add to Budget"}
                </Button>
            </div>
        </div>
    )
}
