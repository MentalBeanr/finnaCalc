"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalculatorPageShell } from "@/components/ds/calculator-page-shell"
import {
    FormErrorBanner,
    ResultEmptyState,
} from "@/components/ds/calculator-result"
import { calculateEmergency } from "@/lib/calculations/emergency"
import type { EmergencyResult } from "@/lib/types/emergency"
import {
    type EmergencyFormState,
    validateEmergencyInput,
} from "@/lib/validators/emergency"
import { EmergencyChart } from "./_components/emergency-chart"
import {
    EMERGENCY_FAQ,
    EmergencyEducation,
} from "./_components/emergency-content"
import { EmergencyForm } from "./_components/emergency-form"
import { EmergencyFormula } from "./_components/emergency-formula"
import { EmergencyResultDisplay } from "./_components/emergency-result"

const INITIAL_FORM: EmergencyFormState = {
    monthlyExpenses: "",
    currentSavings: "",
    targetType: "months",
    targetValue: "6",
    monthlyContribution: "",
    annualRatePercent: "4.5",
}

export default function EmergencyFundCalculatorPage() {
    const [form, setForm] = useState<EmergencyFormState>(INITIAL_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [result, setResult] = useState<EmergencyResult | null>(null)
    const formError = errors._form

    const calculate = () => {
        const validated = validateEmergencyInput(form)
        if (!validated.ok) {
            setErrors(validated.errors)
            setResult(null)
            return
        }
        setErrors({})
        setResult(calculateEmergency(validated.data))
    }

    const formContent = (
        <div className="flex flex-col gap-stack-lg p-6 md:p-10">
            <EmergencyForm value={form} onChange={setForm} errors={errors} />
            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculate} size="lg" className="w-full">
                    Calculate Emergency Fund
                </Button>
            </div>
        </div>
    )

    const resultContent =
        result && !formError ? (
            <EmergencyResultDisplay result={result} />
        ) : (
            <ResultEmptyState
                title="Your emergency fund plan will appear here"
                description="Enter your monthly expenses, current savings, and a target — we'll tell you the gap and how long it takes to close it."
                icon="savings"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Personal Finance"
            title="Emergency Fund Calculator"
            description="Size your reserve against fixed expenses, model the path to your target, and quantify the interest your savings earn along the way."
            category="Personal Finance"
            estimatedMinutes={2}
            backHref="/"
            form={formContent}
            result={resultContent}
            chart={result ? <EmergencyChart form={form} result={result} /> : null}
            formula={{
                eyebrow: "Formula",
                title: "The math behind the timeline",
                children: <EmergencyFormula />,
            }}
            education={{
                eyebrow: "Background",
                title: "How to think about a reserve",
                children: <EmergencyEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common reserve questions",
                description:
                    "What to include, where to keep it, and how the projection actually models interest.",
                items: EMERGENCY_FAQ,
            }}
        />
    )
}
