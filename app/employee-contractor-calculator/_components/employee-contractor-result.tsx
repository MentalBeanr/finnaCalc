"use client"

import {
    ResultComparison,
    type ComparisonBreakdownRow,
    type ComparisonSide,
} from "@/components/ds/result-comparison"
import { formatCurrency, formatPercent } from "@/lib/money/decimal"
import type { EmployeeContractorResult } from "@/lib/types/employee-contractor"

interface EmployeeContractorResultDisplayProps {
    result: EmployeeContractorResult
}

export function EmployeeContractorResultDisplay({
    result,
}: EmployeeContractorResultDisplayProps) {
    const { employee, contractor, comparison } = result

    const verdictTitle = (() => {
        if (comparison.cheaperSide === "even") {
            return "Costs match exactly"
        }
        const subject =
            comparison.cheaperSide === "contractor" ? "Contractor" : "Employee"
        return `${subject} saves ${formatCurrency(comparison.annualSavings.abs())}`
    })()

    const verdictBody =
        comparison.cheaperSide === "even" ? (
            <>
                The two are equivalent at this contractor rate. The
                contractor&apos;s breakeven rate sits exactly at the
                employee&apos;s effective hourly rate of{" "}
                {formatCurrency(employee.effectiveHourlyRate)}.
            </>
        ) : (
            <>
                Per year, on a fully-loaded basis. Breakeven contractor rate:{" "}
                {formatCurrency(comparison.breakevenContractorRate)}/hr — below
                that, the contractor is cheaper; above, the employee is.
            </>
        )

    const employeeBreakdown: ComparisonBreakdownRow[] = [
        { label: "Base Salary", value: formatCurrency(employee.salary) },
        { label: "Benefits", value: formatCurrency(employee.benefits) },
        { label: "Payroll Taxes", value: formatCurrency(employee.payrollTaxes) },
        { label: "Workers' Comp", value: formatCurrency(employee.workersComp) },
        { label: "Unemployment", value: formatCurrency(employee.unemployment) },
        {
            label: "Total Cost",
            value: formatCurrency(employee.totalCost),
            divider: true,
            emphasize: true,
        },
    ]

    const contractorBreakdown: ComparisonBreakdownRow[] = [
        {
            label: "Hourly Rate",
            value: `${formatCurrency(contractor.hourlyRate)}/hr`,
        },
        { label: "Total Hours", value: contractor.totalHours.toString() },
        {
            label: "Annual Cost",
            value: formatCurrency(contractor.annualCost),
            divider: true,
            emphasize: true,
        },
    ]

    const left: ComparisonSide = {
        eyebrow: "W-2",
        label: "Employee",
        primary: {
            label: "Fully-Loaded Cost",
            value: formatCurrency(employee.totalCost),
            sublabel: `${formatCurrency(employee.effectiveHourlyRate)}/hr effective`,
        },
        breakdown: employeeBreakdown,
        winner: comparison.cheaperSide === "employee",
    }

    const right: ComparisonSide = {
        eyebrow: "1099",
        label: "Contractor",
        primary: {
            label: "Annual Cost",
            value: formatCurrency(contractor.annualCost),
            sublabel: `${formatCurrency(contractor.hourlyRate)}/hr × ${contractor.totalHours.toString()}h`,
        },
        breakdown: contractorBreakdown,
        winner: comparison.cheaperSide === "contractor",
    }

    return (
        <ResultComparison
            verdict={{
                eyebrow:
                    comparison.cheaperSide === "even"
                        ? "Result"
                        : `${formatPercent(comparison.savingsPercent, 1)} difference`,
                title: verdictTitle,
                body: verdictBody,
            }}
            left={left}
            right={right}
        />
    )
}
