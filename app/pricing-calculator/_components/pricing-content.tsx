import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const PRICING_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "How realistic is &lsquo;billable hours per week&rsquo;?",
        answer: (
            <>
                Most service providers bill far fewer hours than they work.
                Admin, sales, project management, and learning all consume time
                that doesn&apos;t map to a client invoice. A common rule of
                thumb: full-time billable is 25–32 hours/week sustained. If
                you&apos;re assuming 40, the required rate that the calculator
                returns will be optimistic.
            </>
        ),
    },
    {
        question: "What&apos;s the difference between margin and markup?",
        answer: (
            <>
                Margin is profit as a percent of <em>selling price</em>. Markup
                is profit as a percent of <em>cost</em>. A 50% margin is a 100%
                markup on the same item. Both are useful — margin for setting
                price, markup for comparing sourcing decisions — but mixing
                them up makes you under- or over-price by surprising amounts.
            </>
        ),
    },
    {
        question: "Should I always price below the competition?",
        answer: (
            <>
                No. Below the competition is one of four reasonable strategies
                (cost-plus, competitive, premium, penetration) and rarely the
                most profitable. Premium positioning works when you can
                differentiate on quality, expertise, or brand. Competitive
                pricing makes sense in commodity categories. Below the market
                is a deliberate share-grab move — useful for entry, dangerous
                as a steady state because it&apos;s the easiest to copy.
            </>
        ),
    },
    {
        question: "Why is the required hourly rate higher than what I see in the market?",
        answer: (
            <>
                Probably because the market rate assumes a different fraction
                of the year goes to billable work. The calculator solves the
                exact equation: if you only bill X hours a year and need Y
                after taxes and expenses, the rate that produces Y is what you
                need to charge. If that&apos;s above the market, you need to
                either bill more hours, lower expenses, or reduce the salary
                target.
            </>
        ),
    },
] as const

export function PricingEducation() {
    return (
        <>
            <p>
                Pricing is the most leveraged decision in any business — a 10%
                price increase, holding volume constant, is a 10% revenue
                increase that flows almost entirely to profit. And yet most
                operators set prices once and revisit them only under pressure.
                The point of this calculator isn&apos;t to give you a single
                answer; it&apos;s to test scenarios before you commit.
            </p>
            <p>
                For services, the math is honest: the rate you need is fully
                determined by your expense base, your salary target, your tax
                rate, and the hours you can actually bill. If the resulting
                rate is too high to charge, the constraint isn&apos;t pricing
                — it&apos;s one of the inputs. Either bill more hours, trim
                expenses, or lower the salary target.
            </p>
            <p>
                For products, the four strategies compared here aren&apos;t
                exhaustive but they cover the most common positioning choices.
                Use them as anchors: pick the one that matches your strategic
                story, then check that the resulting margin is one your
                business can sustain.
            </p>
        </>
    )
}
