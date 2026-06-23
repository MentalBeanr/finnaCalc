import { z } from "zod"
import { Decimal } from "@/lib/money/decimal"
import type {
    BudgetFrequency,
    BudgetItem,
    BudgetItemType,
    BudgetType,
} from "@/lib/types/budget"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const schema = z.object({
    category: z.string().min(1, "Pick a category."),
    subcategory: z.string(),
    amount: decimalField("Amount", { allowZero: false }),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    type: z.enum(["income", "expense"]),
    isFixed: z.boolean(),
})

export interface ItemFormState {
    category: string
    subcategory: string
    amount: string
    frequency: BudgetFrequency
    type: BudgetItemType
    isFixed: boolean
}

export const INITIAL_ITEM_FORM: ItemFormState = {
    category: "",
    subcategory: "",
    amount: "",
    frequency: "monthly",
    type: "expense",
    isFixed: false,
}

interface BudgetItemDraft {
    category: string
    subcategory: string
    amount: Decimal
    frequency: BudgetFrequency
    type: BudgetItemType
    isFixed: boolean
}

export function validateBudgetItemInput(
    raw: ItemFormState,
): ValidationResult<BudgetItemDraft> {
    return runSchema<BudgetItemDraft>(
        schema as unknown as z.ZodType<BudgetItemDraft, z.ZodTypeDef, unknown>,
        raw,
    )
}

export function budgetItemFromDraft(
    draft: BudgetItemDraft,
    budgetType: BudgetType,
    existingId?: string,
): BudgetItem {
    return {
        id: existingId ?? Date.now().toString(),
        category: draft.category,
        subcategory: draft.subcategory,
        amount: draft.amount.toNumber(),
        frequency: draft.frequency,
        type: draft.type,
        isFixed: draft.isFixed,
        budgetType,
    }
}
