"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalculatorPageShell } from "@/components/ds/calculator-page-shell"
import {
    FormErrorBanner,
    ResultEmptyState,
} from "@/components/ds/calculator-result"
import {
    STARTUP_TEMPLATES,
    calculateStartupCost,
} from "@/lib/calculations/startup-cost"
import type {
    StartupBusinessType,
    StartupCostResult,
} from "@/lib/types/startup-cost"
import {
    INITIAL_STARTUP_FORM,
    type StartupCostFormState,
    validateStartupCostInput,
} from "@/lib/validators/startup-cost"
import { CostsForm } from "./_components/costs-form"
import {
    STARTUP_COST_FAQ,
    StartupCostEducation,
} from "./_components/startup-cost-content"
import { FundingForm } from "./_components/funding-form"
import { StartupCostFormula } from "./_components/startup-cost-formula"
import { StartupCostResultDisplay } from "./_components/startup-cost-result"

type StartupTab = "costs" | "funding"

export default function StartupCostCalculatorPage() {
    const [tab, setTab] = useState<StartupTab>("costs")
    const [form, setForm] = useState<StartupCostFormState>(INITIAL_STARTUP_FORM)
    const [businessType, setBusinessType] = useState<StartupBusinessType | "">("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [result, setResult] = useState<StartupCostResult | null>(null)
    const formError = errors._form

    const loadTemplate = () => {
        if (!businessType) return
        const template = STARTUP_TEMPLATES[businessType]
        setForm((prev) => {
            const next = { ...prev }
            for (const [key, value] of Object.entries(template)) {
                if (value !== undefined && key in next) {
                    next[key as keyof StartupCostFormState] = String(value)
                }
            }
            return next
        })
        setResult(null)
    }

    const calculate = () => {
        const validated = validateStartupCostInput(form)
        if (!validated.ok) {
            setErrors(validated.errors)
            setResult(null)
            return
        }
        setErrors({})
        setResult(calculateStartupCost(validated.data))
    }

    const formContent = (
        <div className="flex flex-col gap-stack-lg p-10">
            <Tabs value={tab} onValueChange={(v) => setTab(v as StartupTab)}>
                <TabsList>
                    <TabsTrigger value="costs">Costs</TabsTrigger>
                    <TabsTrigger value="funding">Funding</TabsTrigger>
                </TabsList>
                <TabsContent value="costs" className="pt-stack-lg">
                    <CostsForm
                        value={form}
                        onChange={setForm}
                        errors={errors}
                        businessType={businessType}
                        onBusinessTypeChange={setBusinessType}
                        onLoadTemplate={loadTemplate}
                    />
                </TabsContent>
                <TabsContent value="funding" className="pt-stack-lg">
                    <FundingForm value={form} onChange={setForm} errors={errors} />
                </TabsContent>
            </Tabs>
            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculate} size="lg" className="w-full">
                    Calculate Startup Capital
                </Button>
            </div>
        </div>
    )

    const resultContent =
        result && !formError ? (
            <StartupCostResultDisplay result={result} />
        ) : (
            <ResultEmptyState
                title="Your capital plan will appear here"
                description="Enter line-item costs (or load a template), funding sources, and a contingency buffer — we'll compute total capital required and how much funding still needs to be raised."
                icon="rocket_launch"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Business"
            title="Startup Cost Calculator"
            description="Itemize launch costs, apply a contingency buffer, and compare to available funding — with a per-category breakdown of where your capital goes."
            category="Business"
            estimatedMinutes={4}
            backHref="/"
            form={formContent}
            result={resultContent}
            formula={{
                eyebrow: "Formula",
                title: "How the numbers add up",
                children: <StartupCostFormula />,
            }}
            education={{
                eyebrow: "Background",
                title: "Why startups underestimate cost",
                children: <StartupCostEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common startup cost questions",
                description:
                    "Why the buffer matters, what working capital means, and how to use templates without trusting them blindly.",
                items: STARTUP_COST_FAQ,
            }}
        />
    )
}
