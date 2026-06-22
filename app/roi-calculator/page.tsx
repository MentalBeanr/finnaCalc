"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalculatorPageShell } from "@/components/ds/calculator-page-shell"
import {
    FormErrorBanner,
    ResultEmptyState,
} from "@/components/ds/calculator-result"
import { calculateRoi } from "@/lib/calculations/roi"
import type { RoiResult } from "@/lib/types/roi"
import { type RoiFormState, validateRoiInput } from "@/lib/validators/roi"
import { RoiChart } from "./_components/roi-chart"
import { RoiEducation, ROI_FAQ } from "./_components/roi-content"
import { RoiForm } from "./_components/roi-form"
import { RoiFormula } from "./_components/roi-formula"
import { RoiResultDisplay } from "./_components/roi-result"

const INITIAL_FORM: RoiFormState = {
    initialInvestment: "",
    finalValue: "",
    timeYears: "",
    method: "annualized",
    dividendYieldPercent: "0",
    inflationPercent: "3",
    taxRatePercent: "20",
}

export default function RoiCalculatorPage() {
    const [form, setForm] = useState<RoiFormState>(INITIAL_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [result, setResult] = useState<RoiResult | null>(null)
    const formError = errors._form

    const calculate = () => {
        const validated = validateRoiInput(form)
        if (!validated.ok) {
            setErrors(validated.errors)
            setResult(null)
            return
        }
        setErrors({})
        setResult(calculateRoi(validated.data))
    }

    const formContent = (
        <div className="flex flex-col gap-stack-lg p-10">
            <RoiForm value={form} onChange={setForm} errors={errors} />
            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculate} size="lg" className="w-full">
                    Calculate ROI
                </Button>
            </div>
        </div>
    )

    const resultContent =
        result && !formError ? (
            <RoiResultDisplay result={result} />
        ) : (
            <ResultEmptyState
                title="Your ROI analysis will appear here"
                description="Enter what you invested, what it's worth now, and how long you held it — we'll compute annualized, after-tax, and real returns."
                icon="trending_up"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Investing"
            title="ROI Calculator"
            description="Measure the return on any investment with annualized, after-tax, and inflation-adjusted views."
            category="Investing"
            estimatedMinutes={2}
            backHref="/"
            form={formContent}
            result={resultContent}
            chart={result ? <RoiChart result={result} /> : null}
            formula={{
                eyebrow: "Formula",
                title: "The math behind the result",
                children: <RoiFormula />,
            }}
            education={{
                eyebrow: "Background",
                title: "How to read a return number",
                children: <RoiEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common ROI questions",
                description:
                    "What annualization, taxes, and inflation actually do to the headline number.",
                items: ROI_FAQ,
            }}
        />
    )
}
