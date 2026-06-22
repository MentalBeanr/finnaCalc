import type { Decimal } from "@/lib/money/decimal"

export type FilingStatus = "single" | "married" | "head"
export type TaxMode = "individual" | "business"

export interface IndividualTaxInput {
    filingStatus: FilingStatus
    grossIncome: Decimal
    dependents: Decimal
    mortgageInterest: Decimal
    charitableDonations: Decimal
    /** Pre-cap. Calculator applies the SALT cap. */
    stateLocalTax: Decimal
    /** Pre-threshold. Calculator applies the AGI floor. */
    medicalExpenses: Decimal
    /** Pre-cap. Calculator applies the above-the-line cap. */
    studentLoanInterest: Decimal
    childTaxCredit: boolean
    earnedIncomeCredit: boolean
}

export interface IndividualTaxResult {
    kind: "individual"
    grossIncome: Decimal
    adjustedGrossIncome: Decimal
    standardDeduction: Decimal
    itemizedDeductions: Decimal
    /** max(standardDeduction, itemizedDeductions) */
    totalDeductions: Decimal
    usingStandardDeduction: boolean
    taxableIncome: Decimal
    /** Federal tax before credits. */
    federalTax: Decimal
    marginalRatePercent: Decimal
    /** Sum of all applicable credits. */
    taxCredits: Decimal
    /** max(0, federalTax - taxCredits). */
    finalTax: Decimal
    effectiveRatePercent: Decimal
    /** Savings vs. a baseline of standard deduction only, no credits. */
    taxSavings: Decimal
}

export interface BusinessTaxInput {
    businessIncome: Decimal
    businessExpenses: Decimal
    homeOffice: Decimal
    vehicleExpenses: Decimal
    equipment: Decimal
}

export interface BusinessTaxResult {
    kind: "business"
    businessIncome: Decimal
    totalDeductions: Decimal
    netBusinessIncome: Decimal
    selfEmploymentTax: Decimal
    /** 50% of SE tax is deductible from AGI. */
    deductibleSETax: Decimal
    adjustedGrossIncome: Decimal
    standardDeduction: Decimal
    taxableIncome: Decimal
    federalTax: Decimal
    marginalRatePercent: Decimal
    /** federalTax + selfEmploymentTax. */
    totalTax: Decimal
    effectiveRatePercent: Decimal
    /** Savings vs. taking no business deductions at all. */
    taxSavings: Decimal
}

export type TaxResult = IndividualTaxResult | BusinessTaxResult
