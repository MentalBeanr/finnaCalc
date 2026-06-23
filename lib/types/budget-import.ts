import type { BudgetItemType, BudgetType } from "@/lib/types/budget"

export interface ParsedTransaction {
    /** ISO-8601 date string (yyyy-mm-dd) if a date was parseable; empty otherwise. */
    date: string
    /** Cleaned, human-readable description (Title Case). */
    description: string
    /** Absolute dollar amount, always positive. */
    amount: number
    type: BudgetItemType
    /** Category guess based on the description; falls back to "Other". */
    category: string
}

export interface ImportPreviewItem extends ParsedTransaction {
    /** Stable id for selection / dedup before items are committed to the budget. */
    id: string
    selected: boolean
    budgetType: BudgetType
}

export type ImportFileKind = "csv" | "txt" | "pdf"
