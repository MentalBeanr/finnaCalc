import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"
import type { TaxMode } from "@/lib/types/tax"

const INDIVIDUAL_LEGEND = [
    { symbol: "AGI", description: "Adjusted gross income (gross − above-the-line adjustments)" },
    { symbol: "TI", description: "Taxable income" },
    { symbol: "T", description: "Federal tax before credits" },
    { symbol: "C", description: "Sum of applicable credits" },
] as const

const BUSINESS_LEGEND = [
    { symbol: "NBI", description: "Net business income (income − deductions)" },
    { symbol: "SE", description: "Self-employment tax (Social Security + Medicare)" },
    { symbol: "AGI", description: "Adjusted gross income" },
    { symbol: "T", description: "Federal income tax (bracket walk)" },
] as const

interface TaxFormulaProps {
    mode: TaxMode
}

export function TaxFormula({ mode }: TaxFormulaProps) {
    if (mode === "individual") {
        return (
            <div className="flex flex-col gap-stack-lg">
                <FormulaDisplay caption="Taxable income — start here">
                    TI = max(0, AGI − max(standard, itemized))
                </FormulaDisplay>
                <FormulaDisplay caption="Federal tax owed after credits">
                    Final = max(0, T(TI) − C)
                </FormulaDisplay>
                <FormulaLegend items={INDIVIDUAL_LEGEND} />
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                    T(TI) is a piecewise function — the 2024 federal brackets,
                    walked from the bottom up. Each bracket taxes only the income
                    that falls inside it, so your marginal rate (the top bracket
                    you touch) is almost always higher than your effective rate
                    (total tax ÷ gross income).
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Self-employment tax — 15.3% on 92.35% of net income">
                SE = NBI × 0.9235 × 0.153
            </FormulaDisplay>
            <FormulaDisplay caption="Adjusted gross income and final federal tax">
                AGI = NBI − ½ × SE, &nbsp; Total = T(AGI − standard) + SE
            </FormulaDisplay>
            <FormulaLegend items={BUSINESS_LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                The 0.9235 factor accounts for the employer-equivalent half of
                payroll taxes you can&apos;t tax yourself on. Half of the SE tax
                comes back as an above-the-line deduction, reducing the AGI that
                federal income tax is applied to.
            </p>
        </div>
    )
}
