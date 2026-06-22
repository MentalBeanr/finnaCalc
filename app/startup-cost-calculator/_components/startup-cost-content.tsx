import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const STARTUP_COST_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "Why is the 20% buffer the default?",
        answer: (
            <>
                Because new businesses systematically underestimate costs. The
                buffer absorbs the things you can&apos;t itemize in advance —
                a contractor bill that doubled, a piece of equipment that
                failed, marketing that converted at half the rate you modeled.
                20% is a sensible cushion for first-time operators; experienced
                operators with similar business histories might run 10%; below
                10% bets on no surprises.
            </>
        ),
    },
    {
        question: "What counts as working capital here?",
        answer: (
            <>
                Cash on hand to cover the gap between paying expenses and
                collecting from customers. A SaaS business with prepaid annual
                contracts needs almost none; a B2B services business with
                net-30 terms and net-7 vendor terms needs months of payroll. A
                rough heuristic: 2–3 months of operating expenses unless you
                can defend a lower number with concrete payment terms.
            </>
        ),
    },
    {
        question: "Do business loans really count as &lsquo;funding&rsquo;?",
        answer: (
            <>
                Yes — they fund the launch. But they&apos;re not <em>free</em>{" "}
                funding: interest payments eat into early cash flow, and the
                principal has to be repaid. For modeling purposes, count loan
                proceeds toward your funding total but plan for the debt
                service in the operating budget that follows the launch.
            </>
        ),
    },
    {
        question: "How accurate are the template defaults?",
        answer: (
            <>
                They&apos;re order-of-magnitude estimates from typical
                small-business launches. Use them as a starting point to make
                sure you haven&apos;t forgotten a category — then overwrite
                each one with quotes and bids specific to your situation. A
                template that produces $87,500 is not a forecast; it&apos;s a
                checklist.
            </>
        ),
    },
] as const

export function StartupCostEducation() {
    return (
        <>
            <p>
                Most new businesses fail not because the idea was wrong but
                because they ran out of cash before the idea had time to work.
                The job of this calculator is to make sure that doesn&apos;t
                happen for a reason you could have anticipated — by surfacing
                the cost categories first-time operators routinely forget, and
                by applying a contingency buffer for the costs nobody can
                forecast.
            </p>
            <p>
                The breakdown view above shows where your capital actually
                goes. If equipment dominates, you have a hardware-intensive
                business with low scalability; if marketing dominates, you
                have a brand-acquisition business and you should think hard
                about CAC versus LTV. If working capital dominates, you have
                a cash-conversion problem to design around — payment terms
                and collections are as important as the business itself.
            </p>
            <p>
                On the funding side: don&apos;t mistake having money in the
                bank for being funded. The recommended total includes the
                contingency buffer because real businesses encounter
                contingencies. If your funding only covers the line items
                without the buffer, you&apos;re launching with no margin for
                the surprise that&apos;s definitely coming.
            </p>
        </>
    )
}
