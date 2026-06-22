import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"
import type { PricingMode } from "@/lib/types/pricing"

const SERVICE_LEGEND = [
    { symbol: "S", description: "Desired annual salary (take-home)" },
    { symbol: "E", description: "Annual business expenses" },
    { symbol: "h", description: "Total billable hours per year" },
    { symbol: "t", description: "Effective tax rate (decimal)" },
] as const

const PRODUCT_LEGEND = [
    { symbol: "P", description: "Selling price" },
    { symbol: "C", description: "Product cost" },
    { symbol: "m", description: "Target margin (decimal)" },
    { symbol: "d", description: "Volume discount (decimal)" },
] as const

interface PricingFormulaProps {
    mode: PricingMode
}

export function PricingFormula({ mode }: PricingFormulaProps) {
    if (mode === "service") {
        return (
            <div className="flex flex-col gap-stack-lg">
                <FormulaDisplay caption="Required hourly rate to hit a target salary after expenses and taxes">
                    required = (S ÷ (1 − t) + E) ÷ h
                </FormulaDisplay>
                <FormulaDisplay caption="Break-even rate — just covers expenses, no salary">
                    break-even = E ÷ h
                </FormulaDisplay>
                <FormulaLegend items={SERVICE_LEGEND} />
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                    The required rate divides the gross income you need (salary
                    grossed-up for taxes, plus expenses) by the hours you can
                    actually bill. Cutting billable hours by half and keeping
                    everything else constant doubles the required rate — which
                    is usually impossible. Adjust hours and rate together.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Cost-plus selling price derived from a target margin">
                P = C ÷ (1 − m)
            </FormulaDisplay>
            <FormulaDisplay caption="Volume price applies a discount to the selling price">
                volume = P × (1 − d)
            </FormulaDisplay>
            <FormulaLegend items={PRODUCT_LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                Margin and markup are easy to confuse: margin is profit as a
                percent of <em>price</em>, markup is profit as a percent of{" "}
                <em>cost</em>. A 50% margin equals a 100% markup. Margin is the
                right lens for setting price; markup is the right lens for
                comparing units sourced at different costs.
            </p>
        </div>
    )
}
