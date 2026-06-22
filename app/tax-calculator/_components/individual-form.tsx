"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    CheckboxFieldRow,
    FormField,
    SelectFieldShell,
} from "@/components/ds/form-field"
import { Eyebrow } from "@/components/ds/eyebrow"
import type { FilingStatus } from "@/lib/types/tax"
import type { IndividualFormState } from "@/lib/validators/tax"

interface IndividualFormProps {
    value: IndividualFormState
    onChange: (next: IndividualFormState) => void
    errors: Record<string, string>
}

export function IndividualForm({ value, onChange, errors }: IndividualFormProps) {
    const set = <K extends keyof IndividualFormState>(
        key: K,
        next: IndividualFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="flex flex-col gap-stack-xl">
            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>Income & Filing</Eyebrow>
                <div className="grid grid-cols-2 gap-stack-lg">
                    <SelectFieldShell id="filingStatus" label="Filing Status">
                        <Select
                            value={value.filingStatus}
                            onValueChange={(v) =>
                                set("filingStatus", v as FilingStatus)
                            }
                        >
                            <SelectTrigger id="filingStatus">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">
                                    Married Filing Jointly
                                </SelectItem>
                                <SelectItem value="head">Head of Household</SelectItem>
                            </SelectContent>
                        </Select>
                    </SelectFieldShell>

                    <FormField
                        id="grossIncome"
                        label="Annual Income ($)"
                        value={value.grossIncome}
                        onChange={(v) => set("grossIncome", v)}
                        placeholder="75000"
                        error={errors.grossIncome}
                    />

                    <FormField
                        id="dependents"
                        label="Number of Dependents"
                        value={value.dependents}
                        onChange={(v) => set("dependents", v)}
                        placeholder="0"
                        error={errors.dependents}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>Deductions</Eyebrow>
                <div className="grid grid-cols-2 gap-stack-lg">
                    <FormField
                        id="mortgageInterest"
                        label="Mortgage Interest ($)"
                        value={value.mortgageInterest}
                        onChange={(v) => set("mortgageInterest", v)}
                        placeholder="12000"
                        error={errors.mortgageInterest}
                    />
                    <FormField
                        id="charitableDonations"
                        label="Charitable Donations ($)"
                        value={value.charitableDonations}
                        onChange={(v) => set("charitableDonations", v)}
                        placeholder="3000"
                        error={errors.charitableDonations}
                    />
                    <FormField
                        id="stateLocalTax"
                        label="State & Local Taxes ($)"
                        value={value.stateLocalTax}
                        onChange={(v) => set("stateLocalTax", v)}
                        placeholder="8000"
                        helperText="Capped at $10,000 (SALT cap)"
                        error={errors.stateLocalTax}
                    />
                    <FormField
                        id="medicalExpenses"
                        label="Medical Expenses ($)"
                        value={value.medicalExpenses}
                        onChange={(v) => set("medicalExpenses", v)}
                        placeholder="5000"
                        helperText="Deductible above 7.5% of AGI"
                        error={errors.medicalExpenses}
                    />
                    <FormField
                        id="studentLoanInterest"
                        label="Student Loan Interest ($)"
                        value={value.studentLoanInterest}
                        onChange={(v) => set("studentLoanInterest", v)}
                        placeholder="2000"
                        helperText="Capped at $2,500"
                        error={errors.studentLoanInterest}
                        className="col-span-2"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>Credits</Eyebrow>
                <div className="flex flex-col gap-stack-md">
                    <CheckboxFieldRow
                        id="childTaxCredit"
                        label="Child Tax Credit"
                        description="$2,000 per qualifying dependent"
                    >
                        <Checkbox
                            id="childTaxCredit"
                            checked={value.childTaxCredit}
                            onCheckedChange={(checked) =>
                                set("childTaxCredit", Boolean(checked))
                            }
                        />
                    </CheckboxFieldRow>
                    <CheckboxFieldRow
                        id="earnedIncomeCredit"
                        label="Earned Income Tax Credit"
                        description="Phase-in for incomes under $60,000"
                    >
                        <Checkbox
                            id="earnedIncomeCredit"
                            checked={value.earnedIncomeCredit}
                            onCheckedChange={(checked) =>
                                set("earnedIncomeCredit", Boolean(checked))
                            }
                        />
                    </CheckboxFieldRow>
                </div>
            </div>
        </div>
    )
}
