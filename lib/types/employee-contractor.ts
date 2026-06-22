import type { Decimal } from "@/lib/money/decimal"

export interface EmployeeContractorInput {
    /** Base annual salary for the W-2 hire. Must be > 0. */
    annualSalary: Decimal
    /** Hourly rate for the 1099 contractor. Must be > 0. */
    contractorHourlyRate: Decimal
    /** Hours per week the role consumes. */
    hoursPerWeek: Decimal
    /** Working weeks per year. */
    weeksPerYear: Decimal
    /** Benefits load (health, dental, 401k match, PTO, etc.) as percent of salary. */
    benefitsLoadPercent: Decimal
    /** Employer-side FICA (Social Security + Medicare) as percent of salary. */
    payrollTaxPercent: Decimal
    /** Workers' comp insurance as percent of salary. */
    workersCompPercent: Decimal
    /** Unemployment insurance as percent of salary (pre-cap). */
    unemploymentPercent: Decimal
    /** Per-employee cap on the unemployment line item, in dollars. */
    unemploymentCap: Decimal
}

export interface EmployeeCosts {
    salary: Decimal
    benefits: Decimal
    payrollTaxes: Decimal
    workersComp: Decimal
    unemployment: Decimal
    /** Sum of the five line items. */
    totalCost: Decimal
    /** totalCost / (hoursPerWeek × weeksPerYear). */
    effectiveHourlyRate: Decimal
}

export interface ContractorCosts {
    hourlyRate: Decimal
    totalHours: Decimal
    /** hourlyRate × totalHours. */
    annualCost: Decimal
}

export type CheaperSide = "employee" | "contractor" | "even"

export interface EmployeeContractorComparison {
    cheaperSide: CheaperSide
    /** Signed: positive = contractor is cheaper by this much; negative = employee cheaper. */
    annualSavings: Decimal
    /** |savings| / employeeTotal × 100, clamped 0–100. */
    savingsPercent: Decimal
    /** Contractor rate at which annual costs would match — i.e. when the two are equivalent. */
    breakevenContractorRate: Decimal
}

export interface EmployeeContractorResult {
    employee: EmployeeCosts
    contractor: ContractorCosts
    comparison: EmployeeContractorComparison
}
