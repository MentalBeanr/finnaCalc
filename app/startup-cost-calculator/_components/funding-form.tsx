"use client"

import { FormField } from "@/components/ds/form-field"
import { Eyebrow } from "@/components/ds/eyebrow"
import type { StartupCostFormState } from "@/lib/validators/startup-cost"

interface FundingFormProps {
    value: StartupCostFormState
    onChange: (next: StartupCostFormState) => void
    errors: Record<string, string>
}

export function FundingForm({ value, onChange, errors }: FundingFormProps) {
    const set = <K extends keyof StartupCostFormState>(
        key: K,
        next: StartupCostFormState[K],
    ) => onChange({ ...value, [key]: next })

    return (
        <div className="flex flex-col gap-stack-lg">
            <Eyebrow>Funding Sources</Eyebrow>
            <div className="grid grid-cols-2 gap-stack-lg">
                <FormField
                    id="personalSavings"
                    label="Personal Savings ($)"
                    value={value.personalSavings}
                    onChange={(v) => set("personalSavings", v)}
                    placeholder="25000"
                    error={errors.personalSavings}
                />
                <FormField
                    id="loanAmount"
                    label="Business Loan ($)"
                    value={value.loanAmount}
                    onChange={(v) => set("loanAmount", v)}
                    placeholder="50000"
                    error={errors.loanAmount}
                />
                <FormField
                    id="investorFunding"
                    label="Investor Funding ($)"
                    value={value.investorFunding}
                    onChange={(v) => set("investorFunding", v)}
                    placeholder="0"
                    helperText="Equity raised from outside investors"
                    error={errors.investorFunding}
                    className="col-span-2"
                />
            </div>
        </div>
    )
}
