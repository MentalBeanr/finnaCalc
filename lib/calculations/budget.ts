import { D, Decimal, ZERO } from "@/lib/money/decimal"
import type {
    AnalysisItem,
    BudgetFrequency,
    BudgetItem,
    BudgetItemType,
    BudgetTotals,
    CategoryAggregate,
    SavingsGoal,
} from "@/lib/types/budget"

/**
 * Convert a periodic amount to an equivalent monthly figure.
 *
 *   daily   → × 30
 *   weekly  → × 4.33  (≈ 52 / 12)
 *   monthly → × 1
 *   yearly  → ÷ 12
 */
export function convertToMonthly(
    amount: number | Decimal,
    frequency: BudgetFrequency,
): Decimal {
    const a = D(amount)
    switch (frequency) {
        case "daily":
            return a.times(30)
        case "weekly":
            return a.times(4.33)
        case "monthly":
            return a
        case "yearly":
            return a.div(12)
    }
}

/**
 * Sum the monthly equivalents of every income and expense item, derive the
 * net cash flow, and compute the savings rate as a percent of income.
 * Savings rate is 0 when there is no income (avoids division by zero).
 */
export function calculateBudgetTotals(items: ReadonlyArray<BudgetItem>): BudgetTotals {
    let income = ZERO
    let expenses = ZERO
    for (const item of items) {
        const monthly = convertToMonthly(item.amount, item.frequency)
        if (item.type === "income") income = income.plus(monthly)
        else expenses = expenses.plus(monthly)
    }
    const net = income.minus(expenses)
    const savingsRatePercent = income.gt(0) ? net.div(income).times(100) : ZERO
    return {
        monthlyIncome: income,
        monthlyExpenses: expenses,
        monthlyNet: net,
        savingsRatePercent,
    }
}

/**
 * Group items of a given type (income or expense) by category, returning
 * the monthly amount and percent-of-total per category. Sorted desc by
 * amount so the largest category sits first.
 */
export function aggregateByCategory(
    items: ReadonlyArray<BudgetItem>,
    type: BudgetItemType,
): CategoryAggregate[] {
    const map = new Map<string, Decimal>()
    let total = ZERO
    for (const item of items) {
        if (item.type !== type) continue
        const monthly = convertToMonthly(item.amount, item.frequency)
        map.set(item.category, (map.get(item.category) ?? ZERO).plus(monthly))
        total = total.plus(monthly)
    }
    return Array.from(map.entries())
        .map(([category, monthlyAmount]) => ({
            category,
            monthlyAmount,
            percentOfTotal: total.gt(0)
                ? monthlyAmount.div(total).times(100)
                : ZERO,
        }))
        .sort((a, b) => Number(b.monthlyAmount.minus(a.monthlyAmount).toString()))
}

interface AnalysisInputs {
    totals: BudgetTotals
    expensesByCategory: ReadonlyArray<CategoryAggregate>
    items: ReadonlyArray<BudgetItem>
    savingsGoals: ReadonlyArray<SavingsGoal>
}

/**
 * Editorial budget analysis — surfaces the highest-leverage observations
 * about the current budget. Each item is typed (success / warning / info /
 * destructive) and carries a Material Symbols icon name for the UI to render.
 */
export function generateAnalysis({
    totals,
    expensesByCategory,
    items,
    savingsGoals,
}: AnalysisInputs): AnalysisItem[] {
    const out: AnalysisItem[] = []
    const incomeNum = Number(totals.monthlyIncome.toString())
    const netNum = Number(totals.monthlyNet.toString())
    const savingsRate = Number(totals.savingsRatePercent.toString())

    // 1) Net cash flow / savings rate
    if (netNum < 0) {
        out.push({
            kind: "destructive",
            title: "Spending exceeds income",
            message: `You're spending $${formatNum(Math.abs(netNum))} more than you earn each month. Review recurring expenses first — those are usually the easiest place to find savings.`,
            icon: "error",
        })
    } else if (incomeNum > 0 && savingsRate < 10) {
        out.push({
            kind: "warning",
            title: "Low savings rate",
            message: `You're saving ${savingsRate.toFixed(1)}% of income. A healthy target is 10–20% — small reductions in recurring spending compound quickly.`,
            icon: "warning",
        })
    } else if (savingsRate >= 10 && savingsRate < 20) {
        out.push({
            kind: "success",
            title: "Healthy savings rate",
            message: `You're saving ${savingsRate.toFixed(1)}% of income. Solid foundation — consider directing some surplus into longer-term investments.`,
            icon: "check_circle",
        })
    } else if (savingsRate >= 20) {
        out.push({
            kind: "success",
            title: "Excellent savings rate",
            message: `At ${savingsRate.toFixed(1)}% saved, you're well ahead of typical benchmarks. The next question is allocation — invested vs. cash reserves.`,
            icon: "verified",
        })
    }

    // 2) Top expense category
    if (expensesByCategory.length > 0 && incomeNum > 0) {
        const top = expensesByCategory[0]
        const pct =
            (Number(top.monthlyAmount.toString()) / incomeNum) * 100
        out.push({
            kind: "info",
            title: "Largest expense category",
            message: `"${top.category}" is ${pct.toFixed(1)}% of your income. Categories above 30% deserve a close look — that's where pricing leverage tends to live.`,
            icon: "lightbulb",
        })
    }

    // 3) Debt-to-income heuristic
    const debt = items.find(
        (item) => item.type === "expense" && /debt|loan payment/i.test(item.category),
    )
    if (debt && incomeNum > 0) {
        const monthlyDebt = Number(
            convertToMonthly(debt.amount, debt.frequency).toString(),
        )
        const dti = (monthlyDebt / incomeNum) * 100
        if (dti > 15) {
            out.push({
                kind: "warning",
                title: "High debt service",
                message: `Debt payments are ${dti.toFixed(1)}% of income. Lenders typically flag anything over 15% — consider snowball or avalanche strategies to free up cash flow.`,
                icon: "warning",
            })
        }
    }

    // 4) Savings goals reality check
    const plannedContrib = savingsGoals.reduce(
        (acc, g) => acc + g.monthlyContribution,
        0,
    )
    if (plannedContrib > 0 && plannedContrib > netNum) {
        out.push({
            kind: "warning",
            title: "Goals exceed available cash",
            message: `Planned monthly contributions ($${formatNum(plannedContrib)}) exceed monthly net income ($${formatNum(netNum)}). Either reduce expenses, raise income, or revise the goal timelines.`,
            icon: "warning",
        })
    }

    return out
}

function formatNum(n: number): string {
    return n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}
