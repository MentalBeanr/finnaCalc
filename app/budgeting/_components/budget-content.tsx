import * as React from "react"
import { Eyebrow } from "@/components/ds/eyebrow"
import { FaqItem } from "@/components/ds/faq-item"

const BUDGET_FAQ: ReadonlyArray<{ question: string; answer: React.ReactNode }> = [
    {
        question: "How is &lsquo;monthly equivalent&rsquo; computed?",
        answer: (
            <>
                Daily amounts are scaled by 30, weekly by 4.33 (≈ 52 ÷ 12), and
                yearly amounts are divided by 12. The standard normalizes
                everything to a monthly baseline so income and expense items at
                different cadences can be compared directly.
            </>
        ),
    },
    {
        question: "What&apos;s a healthy savings rate?",
        answer: (
            <>
                10% is the common floor; 15–20% is the typical target for
                long-term financial security; 20%+ is what fuels early
                retirement and large-goal accumulation. The savings rate metric
                here is net income divided by total income — what fraction of
                what you make you actually keep.
            </>
        ),
    },
    {
        question: "Where is my budget stored?",
        answer: (
            <>
                In your browser&apos;s local storage on this device. Nothing is
                transmitted to a server. Clearing your browser data or using a
                different device starts fresh — for portability, periodically
                export your items.
            </>
        ),
    },
    {
        question: "What&apos;s the difference between Personal and Business?",
        answer: (
            <>
                Two separate budget books with different category sets — your
                personal budget tracks salary, rent, groceries, etc.; the
                business budget tracks revenue and operating costs. Switching
                between them only changes which items and analysis you see —
                each side keeps its own data.
            </>
        ),
    },
]

export function BudgetEducation() {
    return (
        <>
            <p>
                A budget is the difference between knowing how you spend and
                guessing. The mechanics are simple — income minus expenses —
                but the value comes from the breakdown: which categories
                consume the most, which expenses are fixed versus discretionary,
                and how the savings rate moves over time.
            </p>
            <p>
                Read the analysis tab as a friendly diagnostic, not a verdict.
                The signals it surfaces (low savings rate, top expense
                category, debt-to-income ratio) are the same ones a financial
                planner would check on a first review. They&apos;re directional,
                not prescriptive — every household has different priorities and
                constraints that a calculator can&apos;t see.
            </p>
            <p>
                The most useful thing a budget does is make trade-offs visible.
                If you want to save an extra 5%, you can see exactly which
                categories would need to shrink to get there. If you&apos;re
                planning a goal, you can see whether the math actually works
                before you commit to a timeline.
            </p>
        </>
    )
}

export function BudgetFaq() {
    return (
        <div className="grid grid-cols-12 gap-gutter">
            <div className="col-span-4 flex flex-col gap-stack-md">
                <Eyebrow>FAQ</Eyebrow>
                <h2 className="font-headline-lg text-headline-lg text-primary">
                    Common budget questions
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                    How the math works, where data is stored, and how to use the
                    personal vs business split.
                </p>
            </div>
            <div className="col-span-8">
                {BUDGET_FAQ.map((item, idx) => (
                    <FaqItem
                        key={item.question}
                        question={item.question}
                        defaultOpen={idx === 0}
                    >
                        {item.answer}
                    </FaqItem>
                ))}
            </div>
        </div>
    )
}
