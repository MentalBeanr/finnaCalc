import { z } from "zod"
import type { Decimal } from "@/lib/money/decimal"
import type { StartupCostInput } from "@/lib/types/startup-cost"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const startupCostSchema = z.object({
    equipment: decimalField("Equipment"),
    inventory: decimalField("Inventory"),
    marketing: decimalField("Marketing"),
    legal: decimalField("Legal & professional"),
    rent: decimalField("Rent"),
    utilities: decimalField("Utilities"),
    insurance: decimalField("Insurance"),
    permits: decimalField("Permits"),
    website: decimalField("Website"),
    employees: decimalField("Employee setup"),
    salaries: decimalField("Salaries"),
    workingCapital: decimalField("Working capital"),
    other: decimalField("Other"),
    personalSavings: decimalField("Personal savings"),
    loanAmount: decimalField("Loan amount"),
    investorFunding: decimalField("Investor funding"),
    bufferPercent: decimalField("Buffer", { min: 0, max: 100 }),
})

export interface StartupCostFormState {
    equipment: string
    inventory: string
    marketing: string
    legal: string
    rent: string
    utilities: string
    insurance: string
    permits: string
    website: string
    employees: string
    salaries: string
    workingCapital: string
    other: string
    personalSavings: string
    loanAmount: string
    investorFunding: string
    bufferPercent: string
}

export const INITIAL_STARTUP_FORM: StartupCostFormState = {
    equipment: "0",
    inventory: "0",
    marketing: "0",
    legal: "0",
    rent: "0",
    utilities: "0",
    insurance: "0",
    permits: "0",
    website: "0",
    employees: "0",
    salaries: "0",
    workingCapital: "0",
    other: "0",
    personalSavings: "0",
    loanAmount: "0",
    investorFunding: "0",
    bufferPercent: "20",
}

export function validateStartupCostInput(
    raw: StartupCostFormState,
): ValidationResult<StartupCostInput> {
    return runSchema<StartupCostInput>(
        startupCostSchema as unknown as z.ZodType<StartupCostInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
