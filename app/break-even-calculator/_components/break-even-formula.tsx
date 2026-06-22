import { FormulaDisplay, FormulaLegend } from "@/components/ds/formula-display"

const LEGEND = [
    { symbol: "CM", description: "Contribution margin per unit (price − variable cost)" },
    { symbol: "F", description: "Fixed costs per period" },
    { symbol: "P", description: "Price per unit" },
    { symbol: "V", description: "Variable cost per unit" },
    { symbol: "T", description: "Target profit (dollars on top of break-even)" },
] as const

export function BreakEvenFormula() {
    return (
        <div className="flex flex-col gap-stack-lg">
            <FormulaDisplay caption="Contribution each unit makes toward covering fixed costs">
                CM = P − V
            </FormulaDisplay>
            <FormulaDisplay caption="Units to cover fixed costs exactly">
                Break-even = F ÷ CM
            </FormulaDisplay>
            <FormulaDisplay caption="Units to produce a target profit on top of break-even">
                Target units = (F + T) ÷ CM
            </FormulaDisplay>
            <FormulaLegend items={LEGEND} />
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                Margin of safety = (target units − break-even units) ÷ target units.
                It answers: by what percent can sales fall short of the target
                volume before profit disappears? The wider the safety margin, the
                more resilient the plan.
            </p>
        </div>
    )
}
