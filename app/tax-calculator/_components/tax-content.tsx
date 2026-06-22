import type { CalculatorFaqEntry } from "@/components/ds/calculator-page-shell"

export const TAX_FAQ: ReadonlyArray<CalculatorFaqEntry> = [
    {
        question: "Why is my effective rate so much lower than my marginal rate?",
        answer: (
            <>
                Marginal rate is the rate on your <em>last</em> dollar of taxable
                income — the highest bracket you touch. Effective rate is the
                blended average across all your dollars (total tax ÷ gross income).
                Because lower brackets are taxed at lower rates, the effective
                rate is always below the marginal rate.
            </>
        ),
    },
    {
        question: "When does itemizing beat the standard deduction?",
        answer: (
            <>
                When the sum of your eligible itemized deductions exceeds the
                standard for your filing status. After the 2017 tax law nearly
                doubled the standard deduction and capped SALT at $10,000,
                itemizing now mostly pays off for taxpayers with substantial
                mortgage interest, large charitable giving, or unusually high
                medical expenses (above 7.5% of AGI).
            </>
        ),
    },
    {
        question: "What's the self-employment tax for, exactly?",
        answer: (
            <>
                It funds Social Security (12.4%) and Medicare (2.9%) — the same
                taxes a W-2 employee splits with their employer (each pays 7.65%).
                Self-employed people pay both halves, which is why the rate is
                15.3% on 92.35% of net business income. Half of it is deductible
                from your AGI, partially evening out the bill.
            </>
        ),
    },
    {
        question: "How accurate is this for actual tax filing?",
        answer: (
            <>
                It&apos;s a planning estimate built on the 2024 federal brackets
                and standard deductions. It does <em>not</em> include state taxes,
                AMT, the Additional Medical Tax, the Net Investment Income Tax,
                or many less-common credits and deductions. For real filing, use
                this for sense-making and consult a CPA or tax software with the
                full rule set.
            </>
        ),
    },
] as const

export function TaxEducation() {
    return (
        <>
            <p>
                Federal tax is the largest line item on most household income
                statements, and yet it&apos;s the one most people understand the
                least. The mechanics are straightforward once you separate them:
                start from gross income, subtract above-the-line adjustments to
                reach AGI, subtract the larger of standard or itemized deductions
                to reach taxable income, walk the brackets to compute tax, and
                finally subtract credits to reach what you owe.
            </p>
            <p>
                For self-employed earners, layer self-employment tax (15.3% of
                92.35% of net business income) on top of federal income tax. The
                deductible half of SE tax reduces your AGI, which softens the
                bill on the federal income side.
            </p>
            <p>
                The single highest-leverage planning move for most filers is
                front-loading retirement contributions (401(k), IRA, HSA) — they
                reduce taxable income at your marginal rate, often saving 22–35
                cents for every dollar contributed. Itemizing matters less than
                it used to, but if your mortgage interest plus charitable giving
                plus capped SALT clears the standard deduction, it&apos;s real
                money on the table.
            </p>
        </>
    )
}
