import { z } from "zod"
import type { Decimal } from "@/lib/money/decimal"
import type {
    BusinessTaxInput,
    FilingStatus,
    IndividualTaxInput,
} from "@/lib/types/tax"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const filingStatusEnum = z.enum(["single", "married", "head"])

const individualSchema = z.object({
    filingStatus: filingStatusEnum,
    grossIncome: decimalField("Annual income"),
    dependents: decimalField("Dependents"),
    mortgageInterest: decimalField("Mortgage interest"),
    charitableDonations: decimalField("Charitable donations"),
    stateLocalTax: decimalField("State & local tax"),
    medicalExpenses: decimalField("Medical expenses"),
    studentLoanInterest: decimalField("Student loan interest"),
    childTaxCredit: z.boolean(),
    earnedIncomeCredit: z.boolean(),
})

const businessSchema = z.object({
    businessIncome: decimalField("Business income"),
    businessExpenses: decimalField("Business expenses"),
    homeOffice: decimalField("Home office deduction"),
    vehicleExpenses: decimalField("Vehicle expenses"),
    equipment: decimalField("Equipment / depreciation"),
})

export interface IndividualFormState {
    filingStatus: FilingStatus
    grossIncome: string
    dependents: string
    mortgageInterest: string
    charitableDonations: string
    stateLocalTax: string
    medicalExpenses: string
    studentLoanInterest: string
    childTaxCredit: boolean
    earnedIncomeCredit: boolean
}

export interface BusinessFormState {
    businessIncome: string
    businessExpenses: string
    homeOffice: string
    vehicleExpenses: string
    equipment: string
}

export function validateIndividualTaxInput(
    raw: IndividualFormState,
): ValidationResult<IndividualTaxInput> {
    return runSchema<IndividualTaxInput>(
        individualSchema as unknown as z.ZodType<IndividualTaxInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export function validateBusinessTaxInput(
    raw: BusinessFormState,
): ValidationResult<BusinessTaxInput> {
    return runSchema<BusinessTaxInput>(
        businessSchema as unknown as z.ZodType<BusinessTaxInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
