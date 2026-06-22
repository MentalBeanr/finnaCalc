"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalculatorPageShell } from "@/components/ds/calculator-page-shell"
import {
    FormErrorBanner,
    ResultEmptyState,
} from "@/components/ds/calculator-result"
import { calculateBreakEven } from "@/lib/calculations/break-even"
import type { BreakEvenInput, BreakEvenResult } from "@/lib/types/break-even"
import {
    type BreakEvenFormState,
    validateBreakEvenInput,
} from "@/lib/validators/break-even"
import { BreakEvenChart } from "./_components/break-even-chart"
import {
    BREAK_EVEN_FAQ,
    BreakEvenEducation,
} from "./_components/break-even-content"
import { BreakEvenForm } from "./_components/break-even-form"
import { BreakEvenFormula } from "./_components/break-even-formula"
import { BreakEvenResultDisplay } from "./_components/break-even-result"

const INITIAL_FORM: BreakEvenFormState = {
    fixedCosts: "",
    variableCostPerUnit: "",
    pricePerUnit: "",
    businessType: "single",
    seasonalityPercent: "0",
    targetProfitPercent: "20",
}

export default function BreakEvenCalculatorPage() {
    const [form, setForm] = useState<BreakEvenFormState>(INITIAL_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [resolved, setResolved] = useState<{
        input: BreakEvenInput
        result: BreakEvenResult
    } | null>(null)
    const formError = errors._form

    const calculate = () => {
        const validated = validateBreakEvenInput(form)
        if (!validated.ok) {
            setErrors(validated.errors)
            setResolved(null)
            return
        }
        setErrors({})
        setResolved({
            input: validated.data,
            result: calculateBreakEven(validated.data),
        })
    }

    const hasSeasonality =
        resolved !== null && !resolved.input.seasonalityPercent.isZero()

    const formContent = (
        <div className="flex flex-col gap-stack-lg p-10">
            <BreakEvenForm value={form} onChange={setForm} errors={errors} />
            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculate} size="lg" className="w-full">
                    Calculate Break-Even
                </Button>
            </div>
        </div>
    )

    const resultContent =
        resolved && !formError ? (
            <BreakEvenResultDisplay
                result={resolved.result}
                hasSeasonality={hasSeasonality}
            />
        ) : (
            <ResultEmptyState
                title="Your break-even analysis will appear here"
                description="Enter fixed costs, price, and variable cost per unit — we'll find the volume that covers all your costs and the volume that hits your target profit."
                icon="query_stats"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Business"
            title="Break-Even Calculator"
            description="Find the unit volume and revenue at which a business covers its costs — plus the volume for any target profit and margin of safety."
            category="Business"
            estimatedMinutes={2}
            backHref="/"
            form={formContent}
            result={resultContent}
            chart={
                resolved ? (
                    <BreakEvenChart input={resolved.input} result={resolved.result} />
                ) : null
            }
            formula={{
                eyebrow: "Formula",
                title: "The math behind break-even",
                children: <BreakEvenFormula />,
            }}
            education={{
                eyebrow: "Background",
                title: "How to read a break-even curve",
                children: <BreakEvenEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common break-even questions",
                description:
                    "Fixed vs variable, ceiling rounding, margin of safety, and multi-product extensions.",
                items: BREAK_EVEN_FAQ,
            }}
        />
    )
}
