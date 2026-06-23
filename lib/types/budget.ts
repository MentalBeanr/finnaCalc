import type { Decimal } from "@/lib/money/decimal"

export type BudgetFrequency = "daily" | "weekly" | "monthly" | "yearly"
export type BudgetItemType = "income" | "expense"
export type BudgetType = "personal" | "business"

export interface BudgetItem {
    id: string
    category: string
    subcategory: string
    /** Stored as a number for cheap JSON serialization; converted to Decimal at calc boundaries. */
    amount: number
    frequency: BudgetFrequency
    type: BudgetItemType
    isFixed: boolean
    budgetType: BudgetType
}

export interface SavingsGoal {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    /** ISO-8601 date. */
    targetDate: string
    monthlyContribution: number
}

export interface BudgetTotals {
    monthlyIncome: Decimal
    monthlyExpenses: Decimal
    monthlyNet: Decimal
    /** net / income × 100, clamped at 0 when income is 0. */
    savingsRatePercent: Decimal
}

export interface CategoryAggregate {
    category: string
    monthlyAmount: Decimal
    /** monthlyAmount / sumOfType × 100. */
    percentOfTotal: Decimal
}

export type AnalysisKind = "success" | "warning" | "info" | "destructive"

export interface AnalysisItem {
    kind: AnalysisKind
    title: string
    message: string
    /** Material Symbols Outlined name. */
    icon: string
}

export const PERSONAL_CATEGORIES: Record<BudgetItemType, ReadonlyArray<string>> = {
    income: ["Salary", "Freelance", "Investments", "Gift", "Other"],
    expense: [
        "Housing",
        "Utilities",
        "Food",
        "Transportation",
        "Entertainment",
        "Healthcare",
        "Insurance",
        "Debt Payments",
        "Savings",
        "Other",
    ],
}

export const BUSINESS_CATEGORIES: Record<BudgetItemType, ReadonlyArray<string>> = {
    income: [
        "Sales Revenue",
        "Service Revenue",
        "Subscriptions",
        "Interest Earned",
        "Other Revenue",
    ],
    expense: [
        "Cost of Goods Sold",
        "Salaries / Wages",
        "Marketing",
        "Rent / Lease",
        "Utilities",
        "Software",
        "Supplies",
        "Insurance",
        "Professional Fees",
        "Taxes",
        "Travel",
        "Loan Payments",
        "Other",
    ],
}
