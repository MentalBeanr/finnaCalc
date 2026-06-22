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
    calculateBusinessTax,
    calculateIndividualTax,
} from "@/lib/calculations/tax"
import type { TaxMode, TaxResult } from "@/lib/types/tax"
import {
    type BusinessFormState,
    type IndividualFormState,
    validateBusinessTaxInput,
    validateIndividualTaxInput,
} from "@/lib/validators/tax"
import { BusinessForm } from "./_components/business-form"
import { IndividualForm } from "./_components/individual-form"
import { TaxEducation, TAX_FAQ } from "./_components/tax-content"
import { TaxFormula } from "./_components/tax-formula"
import { TaxResultDisplay } from "./_components/tax-result"

const INITIAL_INDIVIDUAL: IndividualFormState = {
    filingStatus: "single",
    grossIncome: "",
    dependents: "0",
    mortgageInterest: "",
    charitableDonations: "",
    stateLocalTax: "",
    medicalExpenses: "",
    studentLoanInterest: "",
    childTaxCredit: false,
    earnedIncomeCredit: false,
}

const INITIAL_BUSINESS: BusinessFormState = {
    businessIncome: "",
    businessExpenses: "",
    homeOffice: "",
    vehicleExpenses: "",
    equipment: "",
}

const EMPTY_STATE: Record<TaxMode, { title: string; description: string }> = {
    individual: {
        title: "Your tax estimate will appear here",
        description:
            "Enter income, deductions, and credits — we'll compute taxable income, federal tax, marginal and effective rates, and the savings from your deductions.",
    },
    business: {
        title: "Your business tax estimate will appear here",
        description:
            "Enter business income and deductions — we'll compute self-employment tax, federal income tax, and the savings from your deductions.",
    },
}

export default function TaxCalculatorPage() {
    const [mode, setMode] = useState<TaxMode>("individual")
    const [individual, setIndividual] = useState<IndividualFormState>(INITIAL_INDIVIDUAL)
    const [business, setBusiness] = useState<BusinessFormState>(INITIAL_BUSINESS)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [result, setResult] = useState<TaxResult | null>(null)
    const formError = errors._form

    const handleModeChange = (next: string) => {
        setMode(next as TaxMode)
        setErrors({})
        setResult(null)
    }

    const calculate = () => {
        if (mode === "individual") {
            const validated = validateIndividualTaxInput(individual)
            if (!validated.ok) {
                setErrors(validated.errors)
                setResult(null)
                return
            }
            setErrors({})
            setResult(calculateIndividualTax(validated.data))
        } else {
            const validated = validateBusinessTaxInput(business)
            if (!validated.ok) {
                setErrors(validated.errors)
                setResult(null)
                return
            }
            setErrors({})
            setResult(calculateBusinessTax(validated.data))
        }
    }

    const formContent = (
        <div className="flex flex-col gap-stack-lg p-10">
            <Tabs value={mode} onValueChange={handleModeChange}>
                <TabsList>
                    <TabsTrigger value="individual">Individual</TabsTrigger>
                    <TabsTrigger value="business">Business</TabsTrigger>
                </TabsList>
                <TabsContent value="individual" className="pt-stack-lg">
                    <IndividualForm
                        value={individual}
                        onChange={setIndividual}
                        errors={errors}
                    />
                </TabsContent>
                <TabsContent value="business" className="pt-stack-lg">
                    <BusinessForm
                        value={business}
                        onChange={setBusiness}
                        errors={errors}
                    />
                </TabsContent>
            </Tabs>

            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculate} size="lg" className="w-full">
                    Calculate {mode === "individual" ? "Individual" : "Business"} Tax
                </Button>
            </div>
        </div>
    )

    const matchesMode =
        result !== null &&
        ((mode === "individual" && result.kind === "individual") ||
            (mode === "business" && result.kind === "business"))

    const resultContent =
        matchesMode && !formError && result ? (
            <TaxResultDisplay result={result} />
        ) : (
            <ResultEmptyState
                title={EMPTY_STATE[mode].title}
                description={EMPTY_STATE[mode].description}
                icon="receipt_long"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Taxes"
            title="Tax Savings Calculator"
            description="Estimate federal tax for individuals and self-employed earners on the 2024 brackets — and see what your deductions actually saved."
            category="Taxes"
            estimatedMinutes={3}
            backHref="/"
            form={formContent}
            result={resultContent}
            formula={{
                eyebrow: "Formula",
                title: "How federal tax is built",
                children: <TaxFormula mode={mode} />,
            }}
            education={{
                eyebrow: "Background",
                title: "The shape of federal tax",
                children: <TaxEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common tax questions",
                description:
                    "What brackets actually do, why itemizing matters less than it used to, and what this calculator does and doesn't include.",
                items: TAX_FAQ,
            }}
        />
    )
}
