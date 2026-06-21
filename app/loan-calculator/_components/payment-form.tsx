"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { LoanType, PaymentFrequency } from "@/lib/types/loan"
import type { PaymentFormState } from "@/lib/validators/loan"
import { FormField } from "./form-field"

interface PaymentFormProps {
    value: PaymentFormState
    onChange: (next: PaymentFormState) => void
    loanType: LoanType
    onLoanTypeChange: (type: LoanType) => void
    errors: Record<string, string>
}

export function PaymentForm({
    value,
    onChange,
    loanType,
    onLoanTypeChange,
    errors,
}: PaymentFormProps) {
    const set = <K extends keyof PaymentFormState>(key: K, next: PaymentFormState[K]) =>
        onChange({ ...value, [key]: next })

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="loanType">Loan Type</Label>
                <Select value={loanType} onValueChange={(v) => onLoanTypeChange(v as LoanType)}>
                    <SelectTrigger id="loanType">
                        <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="personal">Personal Loan</SelectItem>
                        <SelectItem value="business">Business Loan</SelectItem>
                        <SelectItem value="auto">Auto Loan</SelectItem>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                        <SelectItem value="student">Student Loan</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <FormField
                id="loanAmount"
                label="Loan Amount ($)"
                value={value.loanAmount}
                onChange={(v) => set("loanAmount", v)}
                placeholder="50000"
                error={errors.loanAmount}
            />
            <FormField
                id="interestRate"
                label="Annual Interest Rate (%)"
                value={value.interestRate}
                onChange={(v) => set("interestRate", v)}
                placeholder="5.5"
                step="0.01"
                error={errors.interestRate}
            />
            <FormField
                id="termMonths"
                label="Loan Term (months)"
                value={value.termMonths}
                onChange={(v) => set("termMonths", v)}
                placeholder="60"
                error={errors.termMonths}
            />

            <div>
                <Label htmlFor="frequency">Payment Frequency</Label>
                <Select
                    value={value.frequency}
                    onValueChange={(v) => set("frequency", v as PaymentFrequency)}
                >
                    <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <FormField
                id="downPayment"
                label="Down Payment ($)"
                value={value.downPayment}
                onChange={(v) => set("downPayment", v)}
                placeholder="5000"
                error={errors.downPayment}
            />
        </div>
    )
}
