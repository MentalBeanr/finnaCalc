import { z } from "zod"
import type { Decimal } from "@/lib/money/decimal"
import type { ProfitMarginInput } from "@/lib/types/profit-margin"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const profitMarginSchema = z.object({
    revenue: decimalField("Revenue", { allowZero: false }),
    costOfGoodsSold: decimalField("Cost of goods sold"),
    operatingExpenses: decimalField("Operating expenses"),
    taxRatePercent: decimalField("Tax rate", { max: 100 }),
})

export interface ProfitMarginFormState {
    revenue: string
    costOfGoodsSold: string
    operatingExpenses: string
    taxRatePercent: string
}

export function validateProfitMarginInput(
    raw: ProfitMarginFormState,
): ValidationResult<ProfitMarginInput> {
    return runSchema<ProfitMarginInput>(
        profitMarginSchema as unknown as z.ZodType<ProfitMarginInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
