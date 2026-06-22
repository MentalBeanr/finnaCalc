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
    calculateProductPricing,
    calculateServicePricing,
} from "@/lib/calculations/pricing"
import type { PricingMode, PricingResult } from "@/lib/types/pricing"
import {
    type ProductPricingFormState,
    type ServicePricingFormState,
    validateProductPricingInput,
    validateServicePricingInput,
} from "@/lib/validators/pricing"
import { PRICING_FAQ, PricingEducation } from "./_components/pricing-content"
import { PricingFormula } from "./_components/pricing-formula"
import { PricingResultDisplay } from "./_components/pricing-result"
import { ProductForm } from "./_components/product-form"
import { ServiceForm } from "./_components/service-form"

const INITIAL_SERVICE: ServicePricingFormState = {
    currentHourlyRate: "",
    billableHoursPerWeek: "30",
    weeksPerYear: "50",
    annualExpenses: "",
    desiredSalary: "",
    taxRatePercent: "25",
}

const INITIAL_PRODUCT: ProductPricingFormState = {
    productCost: "",
    desiredMarginPercent: "50",
    competitorPrice: "0",
    volumeDiscountPercent: "0",
    shippingCost: "0",
}

const EMPTY_STATE: Record<PricingMode, { title: string; description: string }> = {
    service: {
        title: "Your service pricing will appear here",
        description:
            "Enter your current rate, billable hours, expenses, and desired salary — we'll find the rate you'd need to hit your target and show scenarios at conservative, current, optimistic, and premium price points.",
    },
    product: {
        title: "Your product pricing will appear here",
        description:
            "Enter your unit cost and target margin — we'll derive the selling price, profit per unit, markup, and compare four standard pricing strategies.",
    },
}

export default function PricingCalculatorPage() {
    const [mode, setMode] = useState<PricingMode>("service")
    const [service, setService] = useState<ServicePricingFormState>(INITIAL_SERVICE)
    const [product, setProduct] = useState<ProductPricingFormState>(INITIAL_PRODUCT)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [result, setResult] = useState<PricingResult | null>(null)
    const formError = errors._form

    const handleModeChange = (next: string) => {
        setMode(next as PricingMode)
        setErrors({})
        setResult(null)
    }

    const calculate = () => {
        if (mode === "service") {
            const validated = validateServicePricingInput(service)
            if (!validated.ok) {
                setErrors(validated.errors)
                setResult(null)
                return
            }
            setErrors({})
            setResult(calculateServicePricing(validated.data))
        } else {
            const validated = validateProductPricingInput(product)
            if (!validated.ok) {
                setErrors(validated.errors)
                setResult(null)
                return
            }
            setErrors({})
            setResult(calculateProductPricing(validated.data))
        }
    }

    const matchesMode =
        result !== null &&
        ((mode === "service" && result.kind === "service") ||
            (mode === "product" && result.kind === "product"))

    const formContent = (
        <div className="flex flex-col gap-stack-lg p-10">
            <Tabs value={mode} onValueChange={handleModeChange}>
                <TabsList>
                    <TabsTrigger value="service">Service</TabsTrigger>
                    <TabsTrigger value="product">Product</TabsTrigger>
                </TabsList>
                <TabsContent value="service" className="pt-stack-lg">
                    <ServiceForm value={service} onChange={setService} errors={errors} />
                </TabsContent>
                <TabsContent value="product" className="pt-stack-lg">
                    <ProductForm value={product} onChange={setProduct} errors={errors} />
                </TabsContent>
            </Tabs>
            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculate} size="lg" className="w-full">
                    Calculate {mode === "service" ? "Service" : "Product"} Pricing
                </Button>
            </div>
        </div>
    )

    const resultContent =
        matchesMode && !formError && result ? (
            <PricingResultDisplay result={result} />
        ) : (
            <ResultEmptyState
                title={EMPTY_STATE[mode].title}
                description={EMPTY_STATE[mode].description}
                icon="sell"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Business"
            title="Pricing Calculator"
            description="Set price points that protect margin while reflecting positioning. Required hourly rate for services; cost-plus selling price with strategies for products."
            category="Business"
            estimatedMinutes={3}
            backHref="/"
            form={formContent}
            result={resultContent}
            formula={{
                eyebrow: "Formula",
                title: "How the price is derived",
                children: <PricingFormula mode={mode} />,
            }}
            education={{
                eyebrow: "Background",
                title: "How to think about price",
                children: <PricingEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common pricing questions",
                description:
                    "Margin vs markup, realistic billable hours, and when to price below the market.",
                items: PRICING_FAQ,
            }}
        />
    )
}
