import { z } from "zod"
import type { Decimal } from "@/lib/money/decimal"
import type { EmployeeContractorInput } from "@/lib/types/employee-contractor"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const schema = z.object({
    annualSalary: decimalField("Annual salary", { allowZero: false }),
    contractorHourlyRate: decimalField("Contractor rate", { allowZero: false }),
    hoursPerWeek: decimalField("Hours per week", { allowZero: false, max: 168 }),
    weeksPerYear: decimalField("Weeks per year", { allowZero: false, max: 52 }),
    benefitsLoadPercent: decimalField("Benefits load", { max: 200 }),
    payrollTaxPercent: decimalField("Payroll tax", { max: 50 }),
    workersCompPercent: decimalField("Workers comp", { max: 50 }),
    unemploymentPercent: decimalField("Unemployment", { max: 50 }),
    unemploymentCap: decimalField("Unemployment cap"),
})

export interface EmployeeContractorFormState {
    annualSalary: string
    contractorHourlyRate: string
    hoursPerWeek: string
    weeksPerYear: string
    benefitsLoadPercent: string
    payrollTaxPercent: string
    workersCompPercent: string
    unemploymentPercent: string
    unemploymentCap: string
}

export const INITIAL_EC_FORM: EmployeeContractorFormState = {
    annualSalary: "",
    contractorHourlyRate: "",
    hoursPerWeek: "40",
    weeksPerYear: "50",
    benefitsLoadPercent: "25",
    payrollTaxPercent: "7.65",
    workersCompPercent: "2",
    unemploymentPercent: "0.6",
    unemploymentCap: "420",
}

export function validateEmployeeContractorInput(
    raw: EmployeeContractorFormState,
): ValidationResult<EmployeeContractorInput> {
    return runSchema<EmployeeContractorInput>(
        schema as unknown as z.ZodType<EmployeeContractorInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
