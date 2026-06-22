import { z } from "zod"
import type { Decimal } from "@/lib/money/decimal"
import type { EmergencyInput, EmergencyTargetType } from "@/lib/types/emergency"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const targetTypeEnum = z.enum(["months", "amount"])

const emergencySchema = z.object({
    monthlyExpenses: decimalField("Monthly expenses", { allowZero: false }),
    currentSavings: decimalField("Current savings"),
    targetType: targetTypeEnum,
    targetValue: decimalField("Target", { allowZero: false }),
    monthlyContribution: decimalField("Monthly contribution"),
    annualRatePercent: decimalField("Interest rate"),
})

export interface EmergencyFormState {
    monthlyExpenses: string
    currentSavings: string
    targetType: EmergencyTargetType
    targetValue: string
    monthlyContribution: string
    annualRatePercent: string
}

export function validateEmergencyInput(
    raw: EmergencyFormState,
): ValidationResult<EmergencyInput> {
    return runSchema<EmergencyInput>(
        emergencySchema as unknown as z.ZodType<EmergencyInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
