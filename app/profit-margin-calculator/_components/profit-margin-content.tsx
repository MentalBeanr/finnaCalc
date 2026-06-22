import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const PROFIT_MARGIN_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "What's the difference between gross, operating, and net margin?",
        answer: (
            <>
                Gross margin subtracts the direct cost of producing whatever you
                sell — materials, direct labor, fulfillment. Operating margin
                additionally subtracts the costs of running the business —
                rent, salaries, marketing, software. Net margin is operating
                profit minus income taxes. Each one strips away a different
                layer; together they tell you where money is being made (or
                lost) along the way.
            </>
        ),
    },
    {
        question: "What's a &lsquo;good&rsquo; margin?",
        answer: (
            <>
                It depends on the industry. Retail and grocery typically run on
                gross 20–40% / net 2–6%. Software and SaaS run gross 70–90% /
                net 15–25%. Restaurants gross 60–70% / net 3–7%. Compare your
                margins to peers in the same business model, not absolute
                benchmarks — a 25% gross margin is excellent for a grocery store
                and disastrous for a software company.
            </>
        ),
    },
    {
        question: "Why does the calculator only tax positive operating profit?",
        answer: (
            <>
                Income tax applies to profit, not revenue. If operations lose
                money, there&apos;s no tax to pay that year — though losses can
                often offset future income via carryforwards (outside this
                calculator&apos;s scope). We don&apos;t simulate refunds because
                the rules depend on other taxable income and the legal entity
                structure.
            </>
        ),
    },
    {
        question: "Does this match what shows up on my P&amp;L?",
        answer: (
            <>
                It models the three classic margins you&apos;ll see on a
                simplified income statement. Real P&amp;Ls add interest expense
                (between operating and pre-tax), depreciation/amortization
                (sometimes split out as EBITDA), and below-the-line items.
                Use this for unit-economics sanity checks; pull the real numbers
                from accounting for filing or board reports.
            </>
        ),
    },
] as const

export function ProfitMarginEducation() {
    return (
        <>
            <p>
                Margins are the cleanest way to compare profitability across
                businesses of different sizes. A $100M business at 10% net
                margin and a $10M business at 10% net margin are doing the same
                thing operationally — the smaller one just has less leverage on
                fixed costs.
            </p>
            <p>
                Watch how the three margins move together. Gross margin moving
                while operating stays flat means production costs changed.
                Operating margin moving while gross stays flat means overhead
                shifted. Net margin moving while operating stays flat is
                usually taxes. Decomposing a margin change into which line
                drove it is where calculator output stops being a number and
                starts being a diagnosis.
            </p>
            <p>
                The single highest-leverage improvement is usually price (raise
                it without losing volume), then COGS (negotiate inputs), then
                operating expenses (trim overhead). Tax planning is real but
                comes after the operating engine is healthy.
            </p>
        </>
    )
}
