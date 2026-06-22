import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const BREAK_EVEN_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "What counts as a fixed cost vs a variable cost?",
        answer: (
            <>
                Fixed costs are the bills you owe regardless of volume — rent,
                salaried staff, insurance, software subscriptions, debt service.
                Variable costs scale with each unit you produce or service you
                deliver — materials, payment processing fees, direct hourly labor,
                fulfillment. The clean test: if volume doubles overnight, does
                this cost double too? Yes → variable.
            </>
        ),
    },
    {
        question: "Why does the calculator round break-even units up?",
        answer: (
            <>
                Partial units don&apos;t pay the rent. If the math says 400.04
                units, the 0.04 is a real shortfall — you actually need to sell
                401 to cover all fixed costs that period. Ceiling rounding makes
                the result actionable.
            </>
        ),
    },
    {
        question: "How should I interpret &lsquo;margin of safety&rsquo;?",
        answer: (
            <>
                It&apos;s the cushion between your target sales volume and
                break-even. A 30% margin of safety means sales can fall 30% short
                of the target before you stop being profitable. Higher is more
                resilient. Below 10% is a fragile plan — small misses become
                losses.
            </>
        ),
    },
    {
        question: "What if I sell multiple products at different prices?",
        answer: (
            <>
                For a mix of products, compute a <em>weighted</em> contribution
                margin: each product&apos;s CM × its share of unit mix, summed
                across the portfolio. Then divide fixed costs by that weighted CM
                to get total break-even units across the mix. This calculator
                models a single-product (or weighted-average) view — for
                product-by-product breakdowns, run it once per SKU with the
                portion of fixed costs that product carries.
            </>
        ),
    },
] as const

export function BreakEvenEducation() {
    return (
        <>
            <p>
                Break-even analysis answers one of the first questions any new
                operator should ask: how much do we have to sell before fixed
                costs are paid for? It separates the dollars you owe regardless
                of volume from the dollars that vary with each transaction, and
                then finds the unit count where the two converge.
            </p>
            <p>
                The chart above is a profit curve — at zero units sold, profit
                equals negative fixed costs (you&apos;re in the hole by exactly
                what you owe). As volume rises, every unit adds the contribution
                margin (price minus variable cost) to the bottom line. The
                crossover where the line touches zero is break-even. Everything
                to the right is profit; everything to the left is loss.
            </p>
            <p>
                Two operating levers move that crossover point: shrinking fixed
                costs (the y-intercept) and widening the contribution margin (the
                slope). Lowering price without a corresponding cost cut flattens
                the slope and pushes break-even further right — usually the
                hardest direction to recover from.
            </p>
        </>
    )
}
