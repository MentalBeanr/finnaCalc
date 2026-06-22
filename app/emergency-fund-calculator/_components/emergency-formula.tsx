import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"

const LEGEND = [
    { symbol: "T", description: "Target fund size" },
    { symbol: "S", description: "Current savings balance" },
    { symbol: "PMT", description: "Monthly contribution" },
    { symbol: "r", description: "Monthly interest rate (annual ÷ 12)" },
    { symbol: "n", description: "Months until the target is reached" },
] as const

export function EmergencyFormula() {
    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Future value of existing balance plus monthly contributions">
                T = S × (1 + r)<sup>n</sup> + PMT × ((1 + r)<sup>n</sup> − 1) ÷ r
            </FormulaDisplay>
            <FormulaDisplay caption="Solved for n (months to reach the goal)">
                n = ln((T + PMT ÷ r) ÷ (S + PMT ÷ r)) ÷ ln(1 + r)
            </FormulaDisplay>
            <FormulaLegend items={LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                When the rate is zero, the formula reduces to n = (T − S) ÷ PMT —
                linear progress with no compounding. When the contribution is zero
                and there&apos;s an existing balance, n = ln(T ÷ S) ÷ ln(1 + r) —
                pure growth on what you already have.
            </p>
        </div>
    )
}
