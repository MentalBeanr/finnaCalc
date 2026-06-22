import { z } from "zod"
import type { Decimal } from "@/lib/money/decimal"
import type { RoiInput, RoiMethod } from "@/lib/types/roi"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const methodEnum = z.enum(["simple", "annualized"])

const roiSchema = z.object({
    initialInvestment: decimalField("Initial investment", { allowZero: false }),
    finalValue: decimalField("Final value"),
    timeYears: decimalField("Time period", { allowZero: false }),
    method: methodEnum,
    dividendYieldPercent: decimalField("Dividend yield"),
    inflationPercent: decimalField("Inflation rate"),
    taxRatePercent: decimalField("Tax rate", { max: 100 }),
})

export interface RoiFormState {
    initialInvestment: string
    finalValue: string
    timeYears: string
    method: RoiMethod
    dividendYieldPercent: string
    inflationPercent: string
    taxRatePercent: string
}

export function validateRoiInput(raw: RoiFormState): ValidationResult<RoiInput> {
    return runSchema<RoiInput>(
        roiSchema as unknown as z.ZodType<RoiInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
