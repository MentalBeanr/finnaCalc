"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalculatorPageShell } from "@/components/ds/calculator-page-shell"
import {
    FormErrorBanner,
    ResultEmptyState,
} from "@/components/ds/calculator-result"
import { calculateProfitMargin } from "@/lib/calculations/profit-margin"
import type { ProfitMarginResult } from "@/lib/types/profit-margin"
import {
    type ProfitMarginFormState,
    validateProfitMarginInput,
} from "@/lib/validators/profit-margin"
import {
    PROFIT_MARGIN_FAQ,
    ProfitMarginEducation,
} from "./_components/profit-margin-content"
import { ProfitMarginForm } from "./_components/profit-margin-form"
import { ProfitMarginFormula } from "./_components/profit-margin-formula"
import { ProfitMarginResultDisplay } from "./_components/profit-margin-result"

const INITIAL_FORM: ProfitMarginFormState = {
    revenue: "",
    costOfGoodsSold: "",
    operatingExpenses: "",
    taxRatePercent: "21",
}

export default function ProfitMarginCalculatorPage() {
    const [form, setForm] = useState<ProfitMarginFormState>(INITIAL_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [result, setResult] = useState<ProfitMarginResult | null>(null)
    const formError = errors._form

    const calculate = () => {
        const validated = validateProfitMarginInput(form)
        if (!validated.ok) {
            setErrors(validated.errors)
            setResult(null)
            return
        }
        setErrors({})
        setResult(calculateProfitMargin(validated.data))
    }

    const formContent = (
        <div className="flex flex-col gap-stack-lg p-10">
            <ProfitMarginForm value={form} onChange={setForm} errors={errors} />
            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculate} size="lg" className="w-full">
                    Calculate Profit Margins
                </Button>
            </div>
        </div>
    )

    const resultContent =
        result && !formError ? (
            <ProfitMarginResultDisplay result={result} />
        ) : (
            <ResultEmptyState
                title="Your margin analysis will appear here"
                description="Enter revenue, COGS, operating expenses, and an effective tax rate — we'll compute gross, operating, and net margins plus the underlying profit dollars."
                icon="analytics"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Business"
            title="Profit Margin Calculator"
            description="Compute gross, operating, and net profit margins from a single period of revenue, costs, and taxes — with a full line-by-line breakdown."
            category="Business"
            estimatedMinutes={1}
            backHref="/"
            form={formContent}
            result={resultContent}
            formula={{
                eyebrow: "Formula",
                title: "The three margins, line by line",
                children: <ProfitMarginFormula />,
            }}
            education={{
                eyebrow: "Background",
                title: "How to read a margin",
                children: <ProfitMarginEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common margin questions",
                description:
                    "Which margin matters when, what counts as a good one, and the limits of this simplified view.",
                items: PROFIT_MARGIN_FAQ,
            }}
        />
    )
}
