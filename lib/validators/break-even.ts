import { z } from "zod"
import type { Decimal } from "@/lib/money/decimal"
import type { BreakEvenInput, BusinessType } from "@/lib/types/break-even"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const businessTypeEnum = z.enum(["single", "multiple", "service"])

const breakEvenSchema = z
    .object({
        fixedCosts: decimalField("Fixed costs", { allowZero: false }),
        variableCostPerUnit: decimalField("Variable cost"),
        pricePerUnit: decimalField("Price", { allowZero: false }),
        businessType: businessTypeEnum,
        seasonalityPercent: decimalField("Seasonality", { min: -100, max: 1000 }),
        targetProfitPercent: decimalField("Target profit"),
    })
    .refine((data) => data.pricePerUnit.gt(data.variableCostPerUnit), {
        message: "Price per unit must exceed variable cost per unit.",
        path: ["pricePerUnit"],
    })

export interface BreakEvenFormState {
    fixedCosts: string
    variableCostPerUnit: string
    pricePerUnit: string
    businessType: BusinessType
    seasonalityPercent: string
    targetProfitPercent: string
}

export function validateBreakEvenInput(
    raw: BreakEvenFormState,
): ValidationResult<BreakEvenInput> {
    return runSchema<BreakEvenInput>(
        breakEvenSchema as unknown as z.ZodType<BreakEvenInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
