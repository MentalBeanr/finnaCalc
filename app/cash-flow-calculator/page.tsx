"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalculatorPageShell } from "@/components/ds/calculator-page-shell"
import {
    FormErrorBanner,
    ResultEmptyState,
} from "@/components/ds/calculator-result"
import { calculateCashFlow } from "@/lib/calculations/cash-flow"
import type { CashFlowResult } from "@/lib/types/cash-flow"
import {
    type CashFlowFormState,
    validateCashFlowInput,
} from "@/lib/validators/cash-flow"
import { CashFlowChart } from "./_components/cash-flow-chart"
import {
    CASH_FLOW_FAQ,
    CashFlowEducation,
} from "./_components/cash-flow-content"
import { CashFlowForm } from "./_components/cash-flow-form"
import { CashFlowFormula } from "./_components/cash-flow-formula"
import { CashFlowResultDisplay } from "./_components/cash-flow-result"

const INITIAL_FORM: CashFlowFormState = {
    monthlyRevenue: "",
    monthlyExpenses: "",
    startingCash: "",
    monthlyGrowthPercent: "5",
    months: "12",
}

export default function CashFlowCalculatorPage() {
    const [form, setForm] = useState<CashFlowFormState>(INITIAL_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [result, setResult] = useState<CashFlowResult | null>(null)
    const formError = errors._form

    const calculate = () => {
        const validated = validateCashFlowInput(form)
        if (!validated.ok) {
            setErrors(validated.errors)
            setResult(null)
            return
        }
        setErrors({})
        setResult(calculateCashFlow(validated.data))
    }

    const formContent = (
        <div className="flex flex-col gap-stack-lg p-6 md:p-10">
            <CashFlowForm value={form} onChange={setForm} errors={errors} />
            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculate} size="lg" className="w-full">
                    Project Cash Flow
                </Button>
            </div>
        </div>
    )

    const resultContent =
        result && !formError ? (
            <CashFlowResultDisplay result={result} />
        ) : (
            <ResultEmptyState
                title="Your cash flow projection will appear here"
                description="Enter your monthly revenue, expenses, and starting balance — we'll project the cash trajectory and find your runway if you have one."
                icon="monitoring"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Business"
            title="Cash Flow Projector"
            description="Model month-by-month cash inflows, outflows, and runway across a rolling horizon. See where the balance goes — and when it might go to zero."
            category="Business"
            estimatedMinutes={3}
            backHref="/"
            form={formContent}
            result={resultContent}
            chart={result ? <CashFlowChart result={result} /> : null}
            formula={{
                eyebrow: "Formula",
                title: "How the projection is built",
                children: <CashFlowFormula />,
            }}
            education={{
                eyebrow: "Background",
                title: "How to read a cash trajectory",
                children: <CashFlowEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common projection questions",
                description:
                    "What runway means, why expenses stay flat, and how to use this to stress-test the business.",
                items: CASH_FLOW_FAQ,
            }}
        />
    )
}
