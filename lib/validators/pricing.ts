import { z } from "zod"
import type { Decimal } from "@/lib/money/decimal"
import type {
    ProductPricingInput,
    ServicePricingInput,
} from "@/lib/types/pricing"
import { decimalField, runSchema, type ValidationResult } from "@/lib/validators/shared"

const serviceSchema = z.object({
    currentHourlyRate: decimalField("Current hourly rate", { allowZero: false }),
    billableHoursPerWeek: decimalField("Billable hours per week", { allowZero: false }),
    weeksPerYear: decimalField("Weeks per year", { allowZero: false, max: 52 }),
    annualExpenses: decimalField("Annual expenses"),
    desiredSalary: decimalField("Desired salary"),
    taxRatePercent: decimalField("Tax rate", { max: 100 }),
})

const productSchema = z.object({
    productCost: decimalField("Product cost"),
    desiredMarginPercent: decimalField("Margin", { min: 0, max: 99 }),
    competitorPrice: decimalField("Competitor price"),
    volumeDiscountPercent: decimalField("Volume discount", { min: 0, max: 99 }),
    shippingCost: decimalField("Shipping cost"),
})

export interface ServicePricingFormState {
    currentHourlyRate: string
    billableHoursPerWeek: string
    weeksPerYear: string
    annualExpenses: string
    desiredSalary: string
    taxRatePercent: string
}

export interface ProductPricingFormState {
    productCost: string
    desiredMarginPercent: string
    competitorPrice: string
    volumeDiscountPercent: string
    shippingCost: string
}

export function validateServicePricingInput(
    raw: ServicePricingFormState,
): ValidationResult<ServicePricingInput> {
    return runSchema<ServicePricingInput>(
        serviceSchema as unknown as z.ZodType<ServicePricingInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export function validateProductPricingInput(
    raw: ProductPricingFormState,
): ValidationResult<ProductPricingInput> {
    return runSchema<ProductPricingInput>(
        productSchema as unknown as z.ZodType<ProductPricingInput, z.ZodTypeDef, unknown>,
        raw,
    )
}

export type { Decimal }
