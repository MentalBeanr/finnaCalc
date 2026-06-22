import { z } from "zod"
import type { Decimal } from "@/lib/money/decimal"
import type { CashFlowInput } from "@/lib/types/cash-flow"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const cashFlowSchema = z.object({
    monthlyRevenue: decimalField("Monthly revenue", { allowZero: false }),
    monthlyExpenses: decimalField("Monthly expenses", { allowZero: false }),
    startingCash: decimalField("Starting cash"),
    monthlyGrowthPercent: decimalField("Growth rate", { min: -100, max: 1000 }),
    months: decimalField("Projection period", { min: 1, max: 120 }),
})

export interface CashFlowFormState {
    monthlyRevenue: string
    monthlyExpenses: string
    startingCash: string
    monthlyGrowthPercent: string
    months: string
}

export function validateCashFlowInput(
    raw: CashFlowFormState,
): ValidationResult<CashFlowInput> {
    return runSchema<CashFlowInput>(
        cashFlowSchema as unknown as z.ZodType<CashFlowInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
