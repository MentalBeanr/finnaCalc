import { describe, expect, it } from "vitest"
import { D, Decimal as DecimalCtor } from "@/lib/money/decimal"
import { calculateEmployeeContractor } from "@/lib/calculations/employee-contractor"
import type { EmployeeContractorInput } from "@/lib/types/employee-contractor"

const round = (value: DecimalCtor, dp: number) => value.toFixed(dp)

const baseInput: EmployeeContractorInput = {
    annualSalary: D(60000),
    contractorHourlyRate: D(40),
    hoursPerWeek: D(40),
    weeksPerYear: D(50),
    benefitsLoadPercent: D(25),
    payrollTaxPercent: D(7.65),
    workersCompPercent: D(2),
    unemploymentPercent: D(0.6),
    unemploymentCap: D(420),
}

describe("calculateEmployeeContractor", () => {
    it("computes the five employee cost line items", () => {
        const r = calculateEmployeeContractor(baseInput)
        // Benefits = 25% of 60k = 15000
        // Payroll taxes = 7.65% of 60k = 4590
        // Workers comp = 2% of 60k = 1200
        // Unemployment = 0.6% of 60k = 360 (under cap)
        // Total = 60000 + 15000 + 4590 + 1200 + 360 = 81150
        expect(r.employee.benefits.toString()).toBe("15000")
        expect(r.employee.payrollTaxes.toString()).toBe("4590")
        expect(r.employee.workersComp.toString()).toBe("1200")
        expect(r.employee.unemployment.toString()).toBe("360")
        expect(r.employee.totalCost.toString()).toBe("81150")
    })

    it("caps the unemployment line at unemploymentCap", () => {
        const r = calculateEmployeeContractor({
            ...baseInput,
            annualSalary: D(200000),
        })
        // Raw unemployment = 0.6% of 200k = 1200; cap = 420
        expect(r.employee.unemployment.toString()).toBe("420")
    })

    it("computes the contractor annual cost from rate × hours × weeks", () => {
        const r = calculateEmployeeContractor(baseInput)
        // 40 × 40 × 50 = 80000
        expect(r.contractor.totalHours.toString()).toBe("2000")
        expect(r.contractor.annualCost.toString()).toBe("80000")
    })

    it("reports contractor cheaper with positive signed savings", () => {
        const r = calculateEmployeeContractor(baseInput)
        // employee 81150 − contractor 80000 = 1150
        expect(r.comparison.cheaperSide).toBe("contractor")
        expect(r.comparison.annualSavings.toString()).toBe("1150")
    })

    it("reports employee cheaper when contractor rate is high", () => {
        const r = calculateEmployeeContractor({
            ...baseInput,
            contractorHourlyRate: D(60),
        })
        // contractor cost = 60 × 2000 = 120000; employee = 81150
        // signed savings = 81150 − 120000 = -38850 (employee cheaper)
        expect(r.comparison.cheaperSide).toBe("employee")
        expect(r.comparison.annualSavings.toString()).toBe("-38850")
    })

    it("computes the breakeven contractor rate as effective employee hourly rate", () => {
        const r = calculateEmployeeContractor(baseInput)
        // totalCost / totalHours = 81150 / 2000 = 40.575
        expect(round(r.comparison.breakevenContractorRate, 4)).toBe("40.5750")
        expect(round(r.employee.effectiveHourlyRate, 4)).toBe("40.5750")
    })

    it("reports even when costs match exactly", () => {
        // Pick contractor rate to exactly match breakeven
        const r = calculateEmployeeContractor({
            ...baseInput,
            contractorHourlyRate: D(40.575),
        })
        expect(r.comparison.cheaperSide).toBe("even")
        expect(r.comparison.annualSavings.toString()).toBe("0")
    })
})
