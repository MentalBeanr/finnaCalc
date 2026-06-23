import { describe, expect, it } from "vitest"
import { D, Decimal as DecimalCtor } from "@/lib/money/decimal"
import {
    aggregateByCategory,
    calculateBudgetTotals,
    convertToMonthly,
    generateAnalysis,
} from "@/lib/calculations/budget"
import type { BudgetItem } from "@/lib/types/budget"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

const mkItem = (
    overrides: Partial<BudgetItem> & { amount: number; type: BudgetItem["type"] },
): BudgetItem => ({
    id: overrides.id ?? Math.random().toString(),
    category: overrides.category ?? "Other",
    subcategory: overrides.subcategory ?? "",
    amount: overrides.amount,
    frequency: overrides.frequency ?? "monthly",
    type: overrides.type,
    isFixed: overrides.isFixed ?? false,
    budgetType: overrides.budgetType ?? "personal",
})

describe("convertToMonthly", () => {
    it("scales by 30 for daily", () => {
        expect(convertToMonthly(10, "daily").toString()).toBe("300")
    })
    it("scales by 4.33 for weekly", () => {
        expect(convertToMonthly(100, "weekly").toString()).toBe("433")
    })
    it("passes through monthly", () => {
        expect(convertToMonthly(500, "monthly").toString()).toBe("500")
    })
    it("divides by 12 for yearly", () => {
        expect(round(convertToMonthly(12000, "yearly"), 2)).toBe("1000.00")
    })
})

describe("calculateBudgetTotals", () => {
    it("sums monthly income and expense across frequencies", () => {
        const r = calculateBudgetTotals([
            mkItem({ amount: 5000, type: "income", frequency: "monthly", category: "Salary" }),
            mkItem({ amount: 100, type: "income", frequency: "weekly", category: "Freelance" }),
            mkItem({ amount: 1500, type: "expense", frequency: "monthly", category: "Housing" }),
            mkItem({ amount: 50, type: "expense", frequency: "daily", category: "Food" }),
        ])
        // income: 5000 + 433 = 5433; expenses: 1500 + 1500 = 3000; net: 2433
        expect(r.monthlyIncome.toString()).toBe("5433")
        expect(r.monthlyExpenses.toString()).toBe("3000")
        expect(r.monthlyNet.toString()).toBe("2433")
        // savings rate: 2433 / 5433 * 100 ≈ 44.78
        expect(round(r.savingsRatePercent, 2)).toBe("44.78")
    })

    it("returns zero savings rate when income is zero", () => {
        const r = calculateBudgetTotals([
            mkItem({ amount: 500, type: "expense", frequency: "monthly" }),
        ])
        expect(r.savingsRatePercent.toString()).toBe("0")
    })

    it("returns negative net when expenses exceed income", () => {
        const r = calculateBudgetTotals([
            mkItem({ amount: 2000, type: "income", frequency: "monthly" }),
            mkItem({ amount: 2500, type: "expense", frequency: "monthly" }),
        ])
        expect(r.monthlyNet.toString()).toBe("-500")
        expect(round(r.savingsRatePercent, 2)).toBe("-25.00")
    })
})

describe("aggregateByCategory", () => {
    it("groups by category, computes percent of total, and sorts desc", () => {
        const r = aggregateByCategory(
            [
                mkItem({ amount: 1500, type: "expense", category: "Housing" }),
                mkItem({ amount: 300, type: "expense", category: "Food" }),
                mkItem({ amount: 500, type: "expense", category: "Food" }),
                mkItem({ amount: 200, type: "expense", category: "Transportation" }),
                mkItem({ amount: 5000, type: "income", category: "Salary" }), // ignored
            ],
            "expense",
        )
        // total expense = 2500; Housing 60%, Food 32%, Transportation 8%
        expect(r.map((c) => c.category)).toEqual(["Housing", "Food", "Transportation"])
        expect(r[0].monthlyAmount.toString()).toBe("1500")
        expect(round(r[0].percentOfTotal, 1)).toBe("60.0")
        expect(r[1].monthlyAmount.toString()).toBe("800")
        expect(round(r[1].percentOfTotal, 1)).toBe("32.0")
    })

    it("returns empty array when no items match type", () => {
        const r = aggregateByCategory(
            [mkItem({ amount: 100, type: "income" })],
            "expense",
        )
        expect(r).toEqual([])
    })
})

describe("generateAnalysis", () => {
    it("flags overspending with a destructive item", () => {
        const items = [
            mkItem({ amount: 3000, type: "income" }),
            mkItem({ amount: 4000, type: "expense" }),
        ]
        const totals = calculateBudgetTotals(items)
        const byCat = aggregateByCategory(items, "expense")
        const out = generateAnalysis({
            totals,
            expensesByCategory: byCat,
            items,
            savingsGoals: [],
        })
        expect(out.find((a) => a.kind === "destructive")).toBeTruthy()
    })

    it("reports a healthy savings rate as success at 15%", () => {
        const items = [
            mkItem({ amount: 10000, type: "income" }),
            mkItem({ amount: 8500, type: "expense" }),
        ]
        const totals = calculateBudgetTotals(items)
        const byCat = aggregateByCategory(items, "expense")
        const out = generateAnalysis({
            totals,
            expensesByCategory: byCat,
            items,
            savingsGoals: [],
        })
        // 15% net / income → "Healthy savings rate"
        expect(
            out.find(
                (a) => a.kind === "success" && a.title.includes("Healthy"),
            ),
        ).toBeTruthy()
    })

    it("warns when debt payments exceed 15% of income", () => {
        const items = [
            mkItem({ amount: 5000, type: "income", category: "Salary" }),
            mkItem({
                amount: 1000,
                type: "expense",
                category: "Debt Payments",
            }),
        ]
        const totals = calculateBudgetTotals(items)
        const byCat = aggregateByCategory(items, "expense")
        const out = generateAnalysis({
            totals,
            expensesByCategory: byCat,
            items,
            savingsGoals: [],
        })
        // 1000 / 5000 = 20% → warning
        expect(
            out.find(
                (a) =>
                    a.kind === "warning" && a.title.includes("debt service"),
            ),
        ).toBeTruthy()
    })

    it("flags savings goals that exceed available net cash", () => {
        const items = [
            mkItem({ amount: 5000, type: "income" }),
            mkItem({ amount: 4500, type: "expense" }),
        ]
        const totals = calculateBudgetTotals(items)
        const byCat = aggregateByCategory(items, "expense")
        const out = generateAnalysis({
            totals,
            expensesByCategory: byCat,
            items,
            savingsGoals: [
                {
                    id: "g1",
                    name: "House",
                    targetAmount: 50000,
                    currentAmount: 0,
                    targetDate: new Date().toISOString(),
                    monthlyContribution: 1000, // > 500 net
                },
            ],
        })
        expect(
            out.find(
                (a) =>
                    a.kind === "warning" && a.title.includes("Goals exceed"),
            ),
        ).toBeTruthy()
    })
})
