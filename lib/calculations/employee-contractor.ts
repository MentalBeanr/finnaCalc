import { Decimal, ZERO } from "@/lib/money/decimal"
import type {
    CheaperSide,
    EmployeeContractorInput,
    EmployeeContractorResult,
} from "@/lib/types/employee-contractor"

/**
 * Fully-loaded annual cost of a W-2 employee versus a 1099 contractor for
 * the same role, with a side-by-side cost breakdown and a signed savings
 * figure.
 *
 *   employee.totalCost  = salary × (1 + benefits/100 + payroll/100 + wc/100)
 *                         + min(salary × unemployment/100, unemploymentCap)
 *   contractor.annualCost = rate × hoursPerWeek × weeksPerYear
 *   savings             = employee.totalCost − contractor.annualCost
 *
 * Positive savings → contractor is cheaper. The breakeven contractor rate
 * is the rate at which the two would cost the same:
 *   breakeven = employee.totalCost / (hoursPerWeek × weeksPerYear)
 *
 * This is a fully-loaded comparison — it includes only the direct cost
 * delta, not productivity differences, IP ownership, or the misclassification
 * risk that comes with treating a contractor like an employee.
 */
export function calculateEmployeeContractor(
    input: EmployeeContractorInput,
): EmployeeContractorResult {
    const {
        annualSalary,
        contractorHourlyRate,
        hoursPerWeek,
        weeksPerYear,
        benefitsLoadPercent,
        payrollTaxPercent,
        workersCompPercent,
        unemploymentPercent,
        unemploymentCap,
    } = input

    const totalHours = hoursPerWeek.times(weeksPerYear)

    const benefits = annualSalary.times(benefitsLoadPercent).div(100)
    const payrollTaxes = annualSalary.times(payrollTaxPercent).div(100)
    const workersComp = annualSalary.times(workersCompPercent).div(100)
    const unemploymentRaw = annualSalary.times(unemploymentPercent).div(100)
    const unemployment = Decimal.min(unemploymentRaw, unemploymentCap)

    const totalCost = annualSalary
        .plus(benefits)
        .plus(payrollTaxes)
        .plus(workersComp)
        .plus(unemployment)
    const effectiveHourlyRate = totalHours.gt(0)
        ? totalCost.div(totalHours)
        : ZERO

    const contractorAnnualCost = contractorHourlyRate.times(totalHours)

    const annualSavings = totalCost.minus(contractorAnnualCost)
    const cheaperSide: CheaperSide = annualSavings.gt(0)
        ? "contractor"
        : annualSavings.lt(0)
            ? "employee"
            : "even"
    const savingsPercent = totalCost.gt(0)
        ? Decimal.min(
              new Decimal(100),
              annualSavings.abs().div(totalCost).times(100),
          )
        : ZERO
    const breakevenContractorRate = totalHours.gt(0)
        ? totalCost.div(totalHours)
        : ZERO

    return {
        employee: {
            salary: annualSalary,
            benefits,
            payrollTaxes,
            workersComp,
            unemployment,
            totalCost,
            effectiveHourlyRate,
        },
        contractor: {
            hourlyRate: contractorHourlyRate,
            totalHours,
            annualCost: contractorAnnualCost,
        },
        comparison: {
            cheaperSide,
            annualSavings,
            savingsPercent,
            breakevenContractorRate,
        },
    }
}
