import { D, Decimal, ZERO } from "@/lib/money/decimal"
import type {
    CostCategory,
    StartupCostInput,
    StartupCostResult,
} from "@/lib/types/startup-cost"

const CATEGORY_DEFS: ReadonlyArray<{
    key: keyof Pick<
        StartupCostInput,
        | "equipment"
        | "inventory"
        | "marketing"
        | "legal"
        | "rent"
        | "utilities"
        | "insurance"
        | "permits"
        | "website"
        | "employees"
        | "salaries"
        | "workingCapital"
        | "other"
    >
    label: string
}> = [
    { key: "equipment", label: "Equipment & Technology" },
    { key: "inventory", label: "Inventory" },
    { key: "marketing", label: "Marketing" },
    { key: "legal", label: "Legal & Professional" },
    { key: "rent", label: "Rent" },
    { key: "utilities", label: "Utilities" },
    { key: "insurance", label: "Insurance" },
    { key: "permits", label: "Permits & Licenses" },
    { key: "website", label: "Website & Digital" },
    { key: "employees", label: "Employee Setup" },
    { key: "salaries", label: "Initial Salaries" },
    { key: "workingCapital", label: "Working Capital" },
    { key: "other", label: "Other" },
] as const

/**
 * Sum the thirteen cost categories, apply a contingency buffer, sum the
 * three funding sources, and report the gap between funding and the
 * recommended total. Categories with zero spend are dropped from the
 * breakdown; remaining ones are sorted by spend desc.
 */
export function calculateStartupCost(input: StartupCostInput): StartupCostResult {
    let totalCosts = ZERO
    for (const { key } of CATEGORY_DEFS) {
        totalCosts = totalCosts.plus(input[key])
    }

    const bufferAmount = totalCosts.times(input.bufferPercent).div(100)
    const totalWithBuffer = totalCosts.plus(bufferAmount)

    const totalFunding = input.personalSavings
        .plus(input.loanAmount)
        .plus(input.investorFunding)
    const fundingGap = totalWithBuffer.minus(totalFunding)
    const fundingCoveragePercent = totalWithBuffer.gt(0)
        ? Decimal.min(D(100), Decimal.max(ZERO, totalFunding.div(totalWithBuffer).times(100)))
        : D(100)

    const costCategories: CostCategory[] = CATEGORY_DEFS.map(({ key, label }) => {
        const value = input[key]
        const percentOfTotal = totalCosts.gt(0)
            ? value.div(totalCosts).times(100)
            : ZERO
        return { key, label, value, percentOfTotal }
    })
        .filter((c) => c.value.gt(0))
        .sort((a, b) => Number(b.value.minus(a.value).toString()))

    return {
        costCategories,
        totalCosts,
        bufferAmount,
        totalWithBuffer,
        funding: {
            personalSavings: input.personalSavings,
            loanAmount: input.loanAmount,
            investorFunding: input.investorFunding,
        },
        totalFunding,
        fundingGap,
        fundingCoveragePercent,
    }
}

export const STARTUP_TEMPLATES: Record<
    "retail" | "restaurant" | "service" | "online" | "manufacturing" | "consulting",
    Partial<Record<keyof StartupCostInput, number>>
> = {
    retail: {
        equipment: 25000,
        inventory: 15000,
        marketing: 8000,
        legal: 3500,
        rent: 12000,
        utilities: 2000,
        insurance: 3000,
        permits: 1500,
        website: 3000,
        workingCapital: 10000,
    },
    restaurant: {
        equipment: 50000,
        inventory: 8000,
        marketing: 10000,
        legal: 5000,
        rent: 18000,
        utilities: 3000,
        insurance: 4000,
        permits: 3000,
        website: 2000,
        workingCapital: 15000,
    },
    service: {
        equipment: 8000,
        inventory: 2000,
        marketing: 5000,
        legal: 2500,
        rent: 6000,
        utilities: 1000,
        insurance: 2000,
        permits: 500,
        website: 4000,
        workingCapital: 8000,
    },
    online: {
        equipment: 5000,
        inventory: 10000,
        marketing: 12000,
        legal: 2000,
        rent: 0,
        utilities: 500,
        insurance: 1500,
        permits: 200,
        website: 8000,
        workingCapital: 12000,
    },
    manufacturing: {
        equipment: 75000,
        inventory: 25000,
        marketing: 8000,
        legal: 5000,
        rent: 15000,
        utilities: 4000,
        insurance: 6000,
        permits: 5000,
        website: 3000,
        workingCapital: 25000,
    },
    consulting: {
        equipment: 3000,
        inventory: 0,
        marketing: 6000,
        legal: 2000,
        rent: 3000,
        utilities: 800,
        insurance: 1500,
        permits: 300,
        website: 5000,
        workingCapital: 5000,
    },
} as const
