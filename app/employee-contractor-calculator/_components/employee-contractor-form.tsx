"use client"

import { FormField } from "@/components/ds/form-field"
import { Eyebrow } from "@/components/ds/eyebrow"
import type { EmployeeContractorFormState } from "@/lib/validators/employee-contractor"

interface EmployeeContractorFormProps {
    value: EmployeeContractorFormState
    onChange: (next: EmployeeContractorFormState) => void
    errors: Record<string, string>
}

export function EmployeeContractorForm({
    value,
    onChange,
    errors,
}: EmployeeContractorFormProps) {
    const set = <K extends keyof EmployeeContractorFormState>(
        key: K,
        next: EmployeeContractorFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="flex flex-col gap-stack-xl">
            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>The Role</Eyebrow>
                <div className="grid grid-cols-2 gap-stack-lg">
                    <FormField
                        id="annualSalary"
                        label="Employee Annual Salary ($)"
                        value={value.annualSalary}
                        onChange={(v) => set("annualSalary", v)}
                        placeholder="60000"
                        helperText="Base W-2 salary, before benefits"
                        error={errors.annualSalary}
                    />
                    <FormField
                        id="contractorHourlyRate"
                        label="Contractor Hourly Rate ($)"
                        value={value.contractorHourlyRate}
                        onChange={(v) => set("contractorHourlyRate", v)}
                        placeholder="40"
                        step="0.01"
                        helperText="What the 1099 contractor charges"
                        error={errors.contractorHourlyRate}
                    />
                    <FormField
                        id="hoursPerWeek"
                        label="Hours per Week"
                        value={value.hoursPerWeek}
                        onChange={(v) => set("hoursPerWeek", v)}
                        placeholder="40"
                        error={errors.hoursPerWeek}
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
                </div>
            </div>

            <div className="flex flex-col gap-stack-lg">
                <Eyebrow>Cost Assumptions</Eyebrow>
                <div className="grid grid-cols-2 gap-stack-lg">
                    <FormField
                        id="benefitsLoadPercent"
                        label="Benefits Load (%)"
                        value={value.benefitsLoadPercent}
                        onChange={(v) => set("benefitsLoadPercent", v)}
                        placeholder="25"
                        step="0.1"
                        helperText="Health, dental, 401k match, PTO — % of salary"
                        error={errors.benefitsLoadPercent}
                    />
                    <FormField
                        id="payrollTaxPercent"
                        label="Payroll Tax (%)"
                        value={value.payrollTaxPercent}
                        onChange={(v) => set("payrollTaxPercent", v)}
                        placeholder="7.65"
                        step="0.01"
                        helperText="Employer-side FICA (7.65% is the cap)"
                        error={errors.payrollTaxPercent}
                    />
                    <FormField
                        id="workersCompPercent"
                        label="Workers' Comp (%)"
                        value={value.workersCompPercent}
                        onChange={(v) => set("workersCompPercent", v)}
                        placeholder="2"
                        step="0.01"
                        helperText="Varies by industry — 1–3% is typical"
                        error={errors.workersCompPercent}
                    />
                    <FormField
                        id="unemploymentPercent"
                        label="Unemployment (%)"
                        value={value.unemploymentPercent}
                        onChange={(v) => set("unemploymentPercent", v)}
                        placeholder="0.6"
                        step="0.01"
                        helperText="State + federal, capped per the next field"
                        error={errors.unemploymentPercent}
                    />
                    <FormField
                        id="unemploymentCap"
                        label="Unemployment Cap ($)"
                        value={value.unemploymentCap}
                        onChange={(v) => set("unemploymentCap", v)}
                        placeholder="420"
                        step="1"
                        helperText="Federal cap (~$420) limits high-salary effect"
                        error={errors.unemploymentCap}
                        className="col-span-2"
                    />
                </div>
            </div>
        </div>
    )
}
