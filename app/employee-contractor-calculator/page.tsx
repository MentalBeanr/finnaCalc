"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalculatorPageShell } from "@/components/ds/calculator-page-shell"
import {
    FormErrorBanner,
    ResultEmptyState,
} from "@/components/ds/calculator-result"
import { calculateEmployeeContractor } from "@/lib/calculations/employee-contractor"
import type { EmployeeContractorResult } from "@/lib/types/employee-contractor"
import {
    INITIAL_EC_FORM,
    type EmployeeContractorFormState,
    validateEmployeeContractorInput,
} from "@/lib/validators/employee-contractor"
import {
    EMPLOYEE_CONTRACTOR_FAQ,
    EmployeeContractorEducation,
} from "./_components/employee-contractor-content"
import { EmployeeContractorForm } from "./_components/employee-contractor-form"
import { EmployeeContractorFormula } from "./_components/employee-contractor-formula"
import { EmployeeContractorResultDisplay } from "./_components/employee-contractor-result"

export default function EmployeeContractorCalculatorPage() {
    const [form, setForm] = useState<EmployeeContractorFormState>(INITIAL_EC_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [result, setResult] = useState<EmployeeContractorResult | null>(null)
    const formError = errors._form

    const calculate = () => {
        const validated = validateEmployeeContractorInput(form)
        if (!validated.ok) {
            setErrors(validated.errors)
            setResult(null)
            return
        }
        setErrors({})
        setResult(calculateEmployeeContractor(validated.data))
    }

    const formContent = (
        <div className="flex flex-col gap-stack-lg p-10">
            <EmployeeContractorForm value={form} onChange={setForm} errors={errors} />
            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculate} size="lg" className="w-full">
                    Compare Employee vs Contractor
                </Button>
            </div>
        </div>
    )

    const resultContent =
        result && !formError ? (
            <EmployeeContractorResultDisplay result={result} />
        ) : (
            <ResultEmptyState
                title="Your comparison will appear here"
                description="Enter the role's salary and a contractor rate — we'll fully load the employee cost (benefits, payroll tax, workers' comp, unemployment) and compare it dollar-for-dollar to the contractor."
                icon="groups"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Business"
            title="Employee vs Contractor"
            description="Compare the fully-loaded annual cost of a W-2 employee against a 1099 contractor for the same role — and find the breakeven contractor rate."
            category="Business"
            estimatedMinutes={2}
            backHref="/"
            form={formContent}
            result={resultContent}
            formula={{
                eyebrow: "Formula",
                title: "How the two are built",
                children: <EmployeeContractorFormula />,
            }}
            education={{
                eyebrow: "Background",
                title: "How to read a comparison",
                children: <EmployeeContractorEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common employee vs contractor questions",
                description:
                    "What the benefits load actually includes, why contractors aren't always cheaper, and how to avoid misclassification.",
                items: EMPLOYEE_CONTRACTOR_FAQ,
            }}
        />
    )
}
