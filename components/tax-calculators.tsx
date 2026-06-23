"use client"

import { useState } from "react"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { MaterialIcon } from "@/components/ds/material-icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TaxCalculatorsProps {
    onBack: () => void
}

type CalculatorId =
    | "tax-calculator"
    | "refund-estimator"
    | "deduction-finder"
    | "quarterly-calculator"
    | "withholding-calculator"

interface TaxResults {
    grossIncome: number
    standardDeduction: number
    taxableIncome: number
    estimatedTax: number
    effectiveRate: number
    marginalRate: number
}

interface RefundResults {
    taxLiability: number
    withheld: number
    credits: number
    refund: number
    owes: boolean
}

interface QuarterlyResults {
    netIncome: number
    selfEmploymentTax: number
    incomeTax: number
    totalTax: number
    quarterlyPayment: number
}

interface DeductionResults {
    totalItemized: number
    standardDeduction: number
    shouldItemize: boolean
    savings: number
    selectedCount: number
    selectedItems: string[]
}

interface WithholdingResults {
    annualTax: number
    perPaycheck: number
    monthlyWithholding: number
    payPeriods: number
    allowances: number
}

function sanitizeNumber(value: string | number | undefined) {
    if (value == null) return 0
    const s = String(value).replace(/[^\d.-]/g, "")
    const n = Number.parseFloat(s)
    return Number.isFinite(n) ? n : 0
}

const CALCULATORS = [
    {
        id: "tax-calculator" as const,
        title: "Tax Calculator",
        description: "Estimate your federal tax liability",
        icon: "calculate" as const,
    },
    {
        id: "refund-estimator" as const,
        title: "Refund Estimator",
        description: "See your potential federal refund",
        icon: "savings" as const,
    },
    {
        id: "deduction-finder" as const,
        title: "Deduction Finder",
        description: "Discover potential federal write-offs",
        icon: "search" as const,
    },
    {
        id: "quarterly-calculator" as const,
        title: "Quarterly Payments",
        description: "Calculate estimated federal tax payments",
        icon: "event" as const,
    },
    {
        id: "withholding-calculator" as const,
        title: "Withholding Calculator",
        description: "Adjust federal paycheck withholdings",
        icon: "pie_chart" as const,
    },
]

const DEDUCTION_ITEMS = [
    {
        category: "Home & Property",
        items: [
            { name: "Mortgage Interest", amount: "Up to $750k loan", common: true, hypotheticalValue: 8000 },
            { name: "Property Taxes", amount: "SALT Cap $10k", common: true, hypotheticalValue: 5000 },
            { name: "Home Office", amount: "$5/sq ft (max $1.5k)", common: false, hypotheticalValue: 1500 },
            { name: "Energy Credits", amount: "Up to $3.2k", common: false, hypotheticalValue: 1000 },
        ],
    },
    {
        category: "Medical & Health",
        items: [
            { name: "Medical Expenses", amount: "> 7.5% of AGI", common: false, hypotheticalValue: 3000 },
            { name: "HSA Contributions", amount: "Up to $4.15k/$8.3k", common: true, hypotheticalValue: 4150 },
        ],
    },
    {
        category: "Education",
        items: [
            { name: "Student Loan Interest", amount: "Up to $2.5k", common: true, hypotheticalValue: 2500 },
            { name: "Educator Expenses", amount: "Up to $300", common: false, hypotheticalValue: 300 },
        ],
    },
    {
        category: "Charitable & Other",
        items: [
            { name: "Charitable Donations", amount: "Up to 60% AGI", common: true, hypotheticalValue: 2000 },
            { name: "State & Local Taxes (SALT)", amount: "Up to $10k", common: true, hypotheticalValue: 10000 },
            { name: "Business Expenses", amount: "Self-employed", common: false, hypotheticalValue: 5000 },
        ],
    },
    {
        category: "Retirement",
        items: [
            { name: "Traditional IRA", amount: "Up to $7k/$8k", common: true, hypotheticalValue: 7000 },
            { name: "Self-Employed Retirement", amount: "Varies", common: false, hypotheticalValue: 10000 },
        ],
    },
]

const COMMON_DISCLAIMER = "*Estimate is for federal taxes only. State taxes vary and are not included.*"

const QUARTERS = [
    { label: "Q1 2024", due: "Due: April 15" },
    { label: "Q2 2024", due: "Due: June 17" },
    { label: "Q3 2024", due: "Due: September 16" },
    { label: "Q4 2024", due: "Due: January 15, 2025" },
]

export default function TaxCalculators({ onBack }: TaxCalculatorsProps) {
    const [activeCalculator, setActiveCalculator] = useState<CalculatorId>("tax-calculator")

    const [income, setIncome] = useState("")
    const [filingStatus, setFilingStatus] = useState("single")
    const [results, setResults] = useState<TaxResults | null>(null)

    const [refundIncome, setRefundIncome] = useState("")
    const [refundWithheld, setRefundWithheld] = useState("")
    const [refundCredits, setRefundCredits] = useState("")
    const [refundResults, setRefundResults] = useState<RefundResults | null>(null)

    const [quarterlyNetIncome, setQuarterlyNetIncome] = useState("")
    const [quarterlyResults, setQuarterlyResults] = useState<QuarterlyResults | null>(null)

    const [selectedDeductions, setSelectedDeductions] = useState<Record<string, boolean>>({})
    const [deductionResults, setDeductionResults] = useState<DeductionResults | null>(null)

    const [withholdingIncome, setWithholdingIncome] = useState("")
    const [withholdingPayPeriods, setWithholdingPayPeriods] = useState("26")
    const [withholdingAllowances, setWithholdingAllowances] = useState("0")
    const [withholdingResults, setWithholdingResults] = useState<WithholdingResults | null>(null)

    const calculateTax = () => {
        const incomeNum = sanitizeNumber(income)
        let standardDeduction = 14600
        if (filingStatus === "married") standardDeduction = 29200
        if (filingStatus === "head") standardDeduction = 21900

        const taxableIncome = Math.max(0, incomeNum - standardDeduction)
        let tax = 0
        let marginalRate = 0

        if (filingStatus === "single") {
            if (taxableIncome <= 11600) { tax = taxableIncome * 0.10; marginalRate = 10 }
            else if (taxableIncome <= 47150) { tax = 1160 + (taxableIncome - 11600) * 0.12; marginalRate = 12 }
            else if (taxableIncome <= 100525) { tax = 5426 + (taxableIncome - 47150) * 0.22; marginalRate = 22 }
            else if (taxableIncome <= 191950) { tax = 17168.5 + (taxableIncome - 100525) * 0.24; marginalRate = 24 }
            else if (taxableIncome <= 243725) { tax = 39110.5 + (taxableIncome - 191950) * 0.32; marginalRate = 32 }
            else if (taxableIncome <= 609350) { tax = 55678.5 + (taxableIncome - 243725) * 0.35; marginalRate = 35 }
            else { tax = 183647.25 + (taxableIncome - 609350) * 0.37; marginalRate = 37 }
        } else if (filingStatus === "married") {
            if (taxableIncome <= 23200) { tax = taxableIncome * 0.10; marginalRate = 10 }
            else if (taxableIncome <= 94300) { tax = 2320 + (taxableIncome - 23200) * 0.12; marginalRate = 12 }
            else if (taxableIncome <= 201050) { tax = 10852 + (taxableIncome - 94300) * 0.22; marginalRate = 22 }
            else if (taxableIncome <= 383900) { tax = 34337 + (taxableIncome - 201050) * 0.24; marginalRate = 24 }
            else if (taxableIncome <= 487450) { tax = 78221 + (taxableIncome - 383900) * 0.32; marginalRate = 32 }
            else if (taxableIncome <= 731200) { tax = 111357 + (taxableIncome - 487450) * 0.35; marginalRate = 35 }
            else { tax = 196669.5 + (taxableIncome - 731200) * 0.37; marginalRate = 37 }
        } else {
            if (taxableIncome <= 16550) { tax = taxableIncome * 0.10; marginalRate = 10 }
            else if (taxableIncome <= 63100) { tax = 1655 + (taxableIncome - 16550) * 0.12; marginalRate = 12 }
            else if (taxableIncome <= 100500) { tax = 7241 + (taxableIncome - 63100) * 0.22; marginalRate = 22 }
            else if (taxableIncome <= 191950) { tax = 15469 + (taxableIncome - 100500) * 0.24; marginalRate = 24 }
            else if (taxableIncome <= 243700) { tax = 37417 + (taxableIncome - 191950) * 0.32; marginalRate = 32 }
            else if (taxableIncome <= 609350) { tax = 53977 + (taxableIncome - 243700) * 0.35; marginalRate = 35 }
            else { tax = 181954.5 + (taxableIncome - 609350) * 0.37; marginalRate = 37 }
        }

        setResults({
            grossIncome: incomeNum,
            standardDeduction,
            taxableIncome,
            estimatedTax: tax,
            effectiveRate: incomeNum > 0 ? (tax / incomeNum) * 100 : 0,
            marginalRate,
        })
    }

    const calculateRefund = () => {
        const incomeNum = sanitizeNumber(refundIncome)
        const withheldNum = sanitizeNumber(refundWithheld)
        const creditsNum = sanitizeNumber(refundCredits)
        const standardDeduction = 14600
        const taxableIncome = Math.max(0, incomeNum - standardDeduction)
        let tax = 0
        if (taxableIncome <= 11600) tax = taxableIncome * 0.10
        else if (taxableIncome <= 47150) tax = 1160 + (taxableIncome - 11600) * 0.12
        else if (taxableIncome <= 100525) tax = 5426 + (taxableIncome - 47150) * 0.22
        else if (taxableIncome <= 191950) tax = 17168.5 + (taxableIncome - 100525) * 0.24
        else tax = 39110.5 + (taxableIncome - 191950) * 0.32

        const totalTaxLiability = Math.max(0, tax - creditsNum)
        const refund = withheldNum - totalTaxLiability

        setRefundResults({
            taxLiability: totalTaxLiability,
            withheld: withheldNum,
            credits: creditsNum,
            refund,
            owes: refund < 0,
        })
    }

    const calculateQuarterly = () => {
        const netIncome = sanitizeNumber(quarterlyNetIncome)
        const seTaxableIncome = netIncome * 0.9235
        const selfEmploymentTax = seTaxableIncome * 0.153
        const deductibleSETax = selfEmploymentTax * 0.5
        const adjustedIncome = netIncome - deductibleSETax
        const standardDeduction = 14600
        const taxableIncome = Math.max(0, adjustedIncome - standardDeduction)
        let incomeTax = 0
        if (taxableIncome <= 11600) incomeTax = taxableIncome * 0.10
        else if (taxableIncome <= 47150) incomeTax = 1160 + (taxableIncome - 11600) * 0.12
        else if (taxableIncome <= 100525) incomeTax = 5426 + (taxableIncome - 47150) * 0.22
        else incomeTax = 17168.5 + (taxableIncome - 100525) * 0.24

        const totalFederalTax = incomeTax + selfEmploymentTax
        const quarterlyPayment = totalFederalTax / 4

        setQuarterlyResults({
            netIncome,
            selfEmploymentTax,
            incomeTax,
            totalTax: totalFederalTax,
            quarterlyPayment,
        })
    }

    const calculateDeductions = (overrides?: Record<string, boolean>) => {
        const selections = overrides ?? selectedDeductions
        let totalDeductions = 0
        const selectedItems: string[] = []
        DEDUCTION_ITEMS.forEach((category) => {
            category.items.forEach((item) => {
                const key = `${category.category}-${item.name}`
                if (selections[key]) {
                    selectedItems.push(item.name)
                    totalDeductions += item.hypotheticalValue || 1000
                }
            })
        })
        const standardDeduction = 14600
        const shouldItemize = totalDeductions > standardDeduction
        setDeductionResults({
            totalItemized: totalDeductions,
            standardDeduction,
            shouldItemize,
            savings: shouldItemize ? totalDeductions - standardDeduction : 0,
            selectedCount: selectedItems.length,
            selectedItems,
        })
    }

    const calculateWithholding = () => {
        const incomeNum = sanitizeNumber(withholdingIncome)
        const payPeriodsNum = sanitizeNumber(withholdingPayPeriods) || 26
        const allowancesNum = sanitizeNumber(withholdingAllowances) || 0
        const standardDeduction = 14600
        const taxableIncome = Math.max(0, incomeNum - standardDeduction)
        let annualTax = 0
        if (taxableIncome <= 11600) annualTax = taxableIncome * 0.10
        else if (taxableIncome <= 47150) annualTax = 1160 + (taxableIncome - 11600) * 0.12
        else if (taxableIncome <= 100525) annualTax = 5426 + (taxableIncome - 47150) * 0.22
        else annualTax = 17168.5 + (taxableIncome - 100525) * 0.24

        const simplifiedAllowanceValue = 5150
        const adjustedAnnualTax = Math.max(0, annualTax - allowancesNum * simplifiedAllowanceValue * 0.12)
        const perPaycheck = adjustedAnnualTax / payPeriodsNum
        const monthlyWithholding = adjustedAnnualTax / 12

        setWithholdingResults({
            annualTax: adjustedAnnualTax,
            perPaycheck,
            monthlyWithholding,
            payPeriods: payPeriodsNum,
            allowances: allowancesNum,
        })
    }

    const toggleDeduction = (category: string, itemName: string) => {
        const key = `${category}-${itemName}`
        const next = { ...selectedDeductions, [key]: !selectedDeductions[key] }
        setSelectedDeductions(next)
        calculateDeductions(next)
    }

    const switchCalculator = (id: CalculatorId) => {
        setActiveCalculator(id)
        setResults(null)
        setRefundResults(null)
        setDeductionResults(null)
        setQuarterlyResults(null)
        setWithholdingResults(null)
    }

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-stack-sm self-start font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Back
                    </button>
                    <h1 className="font-headline-display text-[56px] leading-[1.1] tracking-[-0.02em] text-primary">
                        Tax Optimization Tools
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Calculators and tools to estimate liability, project refunds, and plan deductions.
                    </p>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <div className="grid grid-cols-12 gap-gutter">
                        {/* Sidebar */}
                        <aside className="col-span-3">
                            <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest overflow-hidden">
                                <div className="p-6 border-b border-outline-variant/30">
                                    <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                                        Tax Tools
                                    </p>
                                </div>
                                <div className="flex flex-col">
                                    {CALCULATORS.map((calc) => (
                                        <button
                                            key={calc.id}
                                            onClick={() => switchCalculator(calc.id)}
                                            className={cn(
                                                "w-full text-left p-4 flex items-start gap-stack-md transition-colors border-l-2",
                                                activeCalculator === calc.id
                                                    ? "border-primary bg-surface-container"
                                                    : "border-transparent hover:bg-surface-container/50",
                                            )}
                                        >
                                            <MaterialIcon name={calc.icon} size={18} className="text-primary mt-1" />
                                            <div>
                                                <p className="font-body-md text-body-md text-primary font-semibold">
                                                    {calc.title}
                                                </p>
                                                <p className="font-body-md text-body-md text-on-surface-variant text-xs">
                                                    {calc.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Active calculator */}
                        <div className="col-span-9">
                            {activeCalculator === "tax-calculator" && (
                                <CalculatorPanel
                                    title="Federal Tax Calculator"
                                    description="Estimate your federal income tax liability."
                                >
                                    <div className="grid grid-cols-2 gap-gutter">
                                        <div className="flex flex-col gap-stack-md">
                                            <Field htmlFor="income" label="Annual Income">
                                                <Input
                                                    id="income"
                                                    type="text"
                                                    placeholder="$75,000"
                                                    value={income}
                                                    onChange={(e) => setIncome(e.target.value.replace(/[^\d.-]/g, ""))}
                                                />
                                            </Field>
                                            <Field htmlFor="filing-status" label="Filing Status">
                                                <Select value={filingStatus} onValueChange={setFilingStatus}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="single">Single</SelectItem>
                                                        <SelectItem value="married">Married Filing Jointly</SelectItem>
                                                        <SelectItem value="head">Head of Household</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                            <Field htmlFor="deduction-type" label="Deduction Type">
                                                <Input id="deduction-type" value="Standard Deduction (Estimated)" disabled />
                                                <p className="font-body-md text-xs text-on-surface-variant">
                                                    Itemized deductions can be explored in the Deduction Finder.
                                                </p>
                                            </Field>
                                            <PrimaryButton onClick={calculateTax}>
                                                Calculate Federal Tax
                                            </PrimaryButton>
                                        </div>

                                        {results && (
                                            <div className="flex flex-col gap-stack-md">
                                                <p className="font-headline-md text-headline-md text-primary">
                                                    Federal Tax Results
                                                </p>
                                                <ResultRow label="Gross Income" value={`$${results.grossIncome.toLocaleString()}`} />
                                                <ResultRow label="Standard Deduction" value={`$${results.standardDeduction.toLocaleString()}`} />
                                                <ResultRow label="Taxable Income" value={`$${results.taxableIncome.toLocaleString()}`} />
                                                <div className="border-t border-outline-variant/30 pt-stack-md">
                                                    <HighlightResult
                                                        label="Estimated Federal Tax"
                                                        value={`$${Math.round(results.estimatedTax).toLocaleString()}`}
                                                        tone="error"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-stack-sm">
                                                    <MetricTile label="Effective Rate" value={`${results.effectiveRate.toFixed(1)}%`} />
                                                    <MetricTile label="Marginal Rate" value={`${results.marginalRate}%`} />
                                                </div>
                                                <Disclaimer />
                                            </div>
                                        )}
                                    </div>
                                </CalculatorPanel>
                            )}

                            {activeCalculator === "refund-estimator" && (
                                <CalculatorPanel
                                    title="Federal Tax Refund Estimator"
                                    description="Estimate your potential federal tax refund or amount owed."
                                >
                                    <div className="grid grid-cols-2 gap-gutter">
                                        <div className="flex flex-col gap-stack-md">
                                            <Field htmlFor="refund-income" label="Total Annual Income">
                                                <Input
                                                    id="refund-income"
                                                    type="text"
                                                    placeholder="$65,000"
                                                    value={refundIncome}
                                                    onChange={(e) => setRefundIncome(e.target.value.replace(/[^\d.-]/g, ""))}
                                                />
                                            </Field>
                                            <Field htmlFor="refund-withheld" label="Federal Tax Withheld">
                                                <Input
                                                    id="refund-withheld"
                                                    type="text"
                                                    placeholder="$8,500"
                                                    value={refundWithheld}
                                                    onChange={(e) => setRefundWithheld(e.target.value.replace(/[^\d.-]/g, ""))}
                                                />
                                            </Field>
                                            <Field htmlFor="refund-credits" label="Federal Tax Credits">
                                                <Input
                                                    id="refund-credits"
                                                    type="text"
                                                    placeholder="$2,000"
                                                    value={refundCredits}
                                                    onChange={(e) => setRefundCredits(e.target.value.replace(/[^\d.-]/g, ""))}
                                                />
                                            </Field>
                                            <PrimaryButton onClick={calculateRefund}>
                                                Calculate Federal Refund
                                            </PrimaryButton>
                                        </div>

                                        <div className="flex flex-col gap-stack-md">
                                            {refundResults ? (
                                                <>
                                                    <p className="font-headline-md text-headline-md text-primary">
                                                        Federal Refund Results
                                                    </p>
                                                    <div className={`rounded-lg border-2 p-6 text-center ${refundResults.owes ? "border-error/30 bg-error/10" : "border-success/30 bg-success/10"}`}>
                                                        <MaterialIcon
                                                            name={refundResults.owes ? "report" : "savings"}
                                                            size={36}
                                                            className={refundResults.owes ? "text-error" : "text-success"}
                                                        />
                                                        <p className={`font-headline-md text-[36px] leading-tight mt-stack-md ${refundResults.owes ? "text-error" : "text-success"}`}>
                                                            {refundResults.owes ? "-" : ""}${Math.abs(Math.round(refundResults.refund)).toLocaleString()}
                                                        </p>
                                                        <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">
                                                            {refundResults.owes ? "Estimated Federal Amount Owed" : "Estimated Federal Refund"}
                                                        </p>
                                                    </div>
                                                    <ResultRow label="Fed. Tax Liability" value={`$${Math.round(refundResults.taxLiability).toLocaleString()}`} />
                                                    <ResultRow label="Fed. Tax Withheld" value={`$${Math.round(refundResults.withheld).toLocaleString()}`} />
                                                    <ResultRow label="Fed. Tax Credits" value={`$${Math.round(refundResults.credits).toLocaleString()}`} />
                                                    <Disclaimer />
                                                </>
                                            ) : (
                                                <PlaceholderResult
                                                    icon="savings"
                                                    text="Enter your info to estimate your federal refund."
                                                />
                                            )}
                                        </div>
                                    </div>
                                </CalculatorPanel>
                            )}

                            {activeCalculator === "deduction-finder" && (
                                <CalculatorPanel
                                    title="Federal Deduction Finder"
                                    description="Discover potential federal tax deductions to itemize."
                                >
                                    <div className="flex flex-col gap-stack-lg">
                                        {DEDUCTION_ITEMS.map((category) => (
                                            <div key={category.category}>
                                                <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant mb-stack-md flex items-center gap-stack-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    {category.category}
                                                </p>
                                                <div className="grid grid-cols-3 gap-stack-md">
                                                    {category.items.map((item) => {
                                                        const key = `${category.category}-${item.name}`
                                                        const selected = selectedDeductions[key]
                                                        return (
                                                            <label
                                                                key={item.name}
                                                                htmlFor={key}
                                                                className={cn(
                                                                    "flex flex-col rounded-lg border p-4 cursor-pointer transition-colors",
                                                                    selected
                                                                        ? "border-primary bg-surface-container"
                                                                        : "border-outline-variant/30 hover:border-primary/40",
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between mb-stack-sm">
                                                                    <p className="font-body-md text-body-md text-primary font-semibold">
                                                                        {item.name}
                                                                    </p>
                                                                    {item.common && (
                                                                        <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] bg-surface-container text-on-surface-variant rounded-full px-2 py-0.5 text-[10px]">
                                                                            Common
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="font-body-md text-body-md text-on-surface-variant text-xs mb-stack-md">
                                                                    {item.amount}
                                                                </p>
                                                                <div className="flex items-center gap-stack-sm mt-auto pt-stack-sm border-t border-dashed border-outline-variant/30">
                                                                    <input
                                                                        id={key}
                                                                        type="checkbox"
                                                                        className="rounded accent-primary cursor-pointer"
                                                                        checked={selected || false}
                                                                        onChange={() => toggleDeduction(category.category, item.name)}
                                                                    />
                                                                    <span className="font-body-md text-body-md text-on-surface-variant text-xs">
                                                                        I believe I qualify
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {deductionResults && (
                                            <div className="rounded-lg border border-primary/30 bg-surface-container p-6 flex flex-col gap-stack-md">
                                                <p className="font-headline-md text-headline-md text-primary">
                                                    Potential Federal Deduction Summary
                                                </p>
                                                <ResultRow label="Selected Potential Deductions" value={`${deductionResults.selectedCount} items`} />
                                                <ResultRow label="Estimated Itemized Total*" value={`$${deductionResults.totalItemized.toLocaleString()}`} />
                                                <ResultRow label="Standard Deduction (Single 2024)" value={`$${deductionResults.standardDeduction.toLocaleString()}`} />
                                                <div className="border-t border-outline-variant/30 pt-stack-md">
                                                    <HighlightResult
                                                        label="Recommendation"
                                                        value={deductionResults.shouldItemize ? "Itemize (Federal)" : "Take Standard (Federal)"}
                                                        tone="primary"
                                                    />
                                                </div>
                                                {deductionResults.shouldItemize && (
                                                    <div className="rounded-lg bg-success/10 p-4 text-center">
                                                        <p className="font-body-md text-body-md text-success font-semibold">
                                                            Itemizing could potentially increase your federal deduction by ${deductionResults.savings.toLocaleString()}!*
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="font-body-md text-xs text-on-surface-variant text-center">
                                                    *Based on hypothetical values. Actual amounts vary. State deduction rules differ.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CalculatorPanel>
                            )}

                            {activeCalculator === "quarterly-calculator" && (
                                <CalculatorPanel
                                    title="Quarterly Federal Tax Payment Calculator"
                                    description="Estimate federal tax payments for self-employed individuals."
                                >
                                    <div className="grid grid-cols-2 gap-gutter">
                                        <div className="flex flex-col gap-stack-md">
                                            <Field htmlFor="quarterly-net-income" label="Expected Annual Net Income (After Expenses)">
                                                <Input
                                                    id="quarterly-net-income"
                                                    type="text"
                                                    placeholder="$80,000"
                                                    value={quarterlyNetIncome}
                                                    onChange={(e) => setQuarterlyNetIncome(e.target.value.replace(/[^\d.-]/g, ""))}
                                                />
                                            </Field>
                                            <PrimaryButton onClick={calculateQuarterly}>
                                                Calculate Federal Quarterly Payments
                                            </PrimaryButton>
                                        </div>

                                        <div className="flex flex-col gap-stack-md">
                                            {quarterlyResults ? (
                                                <>
                                                    <p className="font-headline-md text-headline-md text-primary">
                                                        Federal Payment Results
                                                    </p>
                                                    <div className="rounded-lg border border-outline-variant/30 p-4 flex flex-col gap-stack-sm">
                                                        <ResultRow label="Net Income (Est.)" value={`$${quarterlyResults.netIncome.toLocaleString()}`} inline />
                                                        <ResultRow label="Fed. Income Tax (Est.)" value={`$${Math.round(quarterlyResults.incomeTax).toLocaleString()}`} inline />
                                                        <ResultRow label="SE Tax (Est.)" value={`$${Math.round(quarterlyResults.selfEmploymentTax).toLocaleString()}`} inline />
                                                        <div className="border-t border-outline-variant/30 pt-stack-sm">
                                                            <ResultRow
                                                                label="Total Annual Federal Tax (Est.)"
                                                                value={`$${Math.round(quarterlyResults.totalTax).toLocaleString()}`}
                                                                inline
                                                                bold
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant mt-stack-md">
                                                        Estimated Federal Payments (2024 Schedule)
                                                    </p>
                                                    <div className="flex flex-col gap-stack-sm">
                                                        {QUARTERS.map((q) => (
                                                            <div
                                                                key={q.label}
                                                                className="flex justify-between items-center p-3 border border-outline-variant/30 rounded-lg"
                                                            >
                                                                <div>
                                                                    <p className="font-body-md text-body-md text-primary font-semibold">
                                                                        {q.label}
                                                                    </p>
                                                                    <p className="font-body-md text-body-md text-on-surface-variant text-xs">
                                                                        {q.due}
                                                                    </p>
                                                                </div>
                                                                <p className="font-body-md text-body-md text-primary font-semibold">
                                                                    ${Math.round(quarterlyResults.quarterlyPayment).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="font-body-md text-xs text-on-surface-variant text-center">
                                                        {COMMON_DISCLAIMER} State quarterly payments may also be required.
                                                    </p>
                                                </>
                                            ) : (
                                                <PlaceholderResult
                                                    icon="event"
                                                    text="Enter net income to estimate federal payments."
                                                />
                                            )}
                                        </div>
                                    </div>
                                </CalculatorPanel>
                            )}

                            {activeCalculator === "withholding-calculator" && (
                                <CalculatorPanel
                                    title="Federal Withholding Calculator"
                                    description="Estimate federal tax withholdings from your paycheck (simplified)."
                                >
                                    <div className="flex flex-col gap-stack-lg">
                                        <div className="grid grid-cols-2 gap-gutter">
                                            <div className="flex flex-col gap-stack-md">
                                                <Field htmlFor="withholding-income" label="Annual Salary">
                                                    <Input
                                                        id="withholding-income"
                                                        type="text"
                                                        placeholder="$75,000"
                                                        value={withholdingIncome}
                                                        onChange={(e) => setWithholdingIncome(e.target.value.replace(/[^\d.-]/g, ""))}
                                                    />
                                                </Field>
                                                <Field htmlFor="withholding-pay-periods" label="Pay Periods per Year">
                                                    <Input
                                                        id="withholding-pay-periods"
                                                        type="text"
                                                        placeholder="26 (bi-weekly)"
                                                        value={withholdingPayPeriods}
                                                        onChange={(e) => setWithholdingPayPeriods(e.target.value.replace(/[^\d.-]/g, ""))}
                                                    />
                                                    <p className="font-body-md text-xs text-on-surface-variant">
                                                        Weekly: 52, Bi-weekly: 26, Monthly: 12
                                                    </p>
                                                </Field>
                                                <Field htmlFor="withholding-allowances" label="W-4 Allowances (Simplified)">
                                                    <Input
                                                        id="withholding-allowances"
                                                        type="text"
                                                        placeholder="0"
                                                        value={withholdingAllowances}
                                                        onChange={(e) => setWithholdingAllowances(e.target.value.replace(/[^\d.-]/g, ""))}
                                                    />
                                                    <p className="font-body-md text-xs text-on-surface-variant">
                                                        Note: Uses older allowance system for estimation.
                                                    </p>
                                                </Field>
                                                <PrimaryButton onClick={calculateWithholding}>
                                                    Calculate Federal Withholding
                                                </PrimaryButton>
                                            </div>

                                            <div className="flex flex-col gap-stack-md">
                                                {withholdingResults ? (
                                                    <>
                                                        <p className="font-headline-md text-headline-md text-primary">
                                                            Federal Withholding Results
                                                        </p>
                                                        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6 text-center">
                                                            <MaterialIcon name="pie_chart" size={36} className="text-primary" />
                                                            <p className="font-headline-md text-[36px] leading-tight text-primary mt-stack-md">
                                                                ${Math.round(withholdingResults.perPaycheck).toLocaleString()}
                                                            </p>
                                                            <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">
                                                                Federal Tax Per Paycheck (Est.)
                                                            </p>
                                                        </div>
                                                        <ResultRow label="Est. Annual Federal Tax" value={`$${Math.round(withholdingResults.annualTax).toLocaleString()}`} />
                                                        <ResultRow label="Est. Monthly Federal Withholding" value={`$${Math.round(withholdingResults.monthlyWithholding).toLocaleString()}`} />
                                                        <ResultRow label="Pay Periods" value={`${withholdingResults.payPeriods}`} />
                                                        <div className="rounded-lg border-l-2 border-primary bg-surface-container-low p-4">
                                                            <p className="font-body-md text-body-md text-on-surface">
                                                                <strong>Tip:</strong> Use the official IRS Withholding Estimator for accurate W-4 adjustments. State withholding not included.
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <PlaceholderResult
                                                        icon="pie_chart"
                                                        text="Enter info to estimate federal withholding."
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border border-outline-variant/30 p-4">
                                            <div className="flex items-center gap-stack-sm mb-stack-sm">
                                                <MaterialIcon name="info" size={16} className="text-primary" />
                                                <p className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                                                    About W-4 Withholding
                                                </p>
                                            </div>
                                            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm">
                                                Your W-4 form tells your employer how much federal tax to withhold. Adjusting it helps match your tax liability to avoid owing or overpaying significantly.
                                            </p>
                                            <a
                                                href="https://www.irs.gov/individuals/tax-withholding-estimator"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-stack-sm font-ui-button text-ui-button uppercase tracking-[0.05em] text-primary hover:text-primary/70 transition-colors"
                                            >
                                                Use Official IRS Estimator
                                                <MaterialIcon name="open_in_new" size={14} />
                                            </a>
                                        </div>
                                    </div>
                                </CalculatorPanel>
                            )}
                        </div>
                    </div>
                </Container>
            </Section>
        </div>
    )
}

function CalculatorPanel({
    title,
    description,
    children,
}: {
    title: string
    description: string
    children: React.ReactNode
}) {
    return (
        <div className="border border-outline-variant/30 rounded-lg bg-surface-container-lowest p-10 flex flex-col gap-stack-lg">
            <div>
                <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">
                    {description}
                </p>
            </div>
            {children}
        </div>
    )
}

function Field({
    htmlFor,
    label,
    children,
}: {
    htmlFor: string
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-stack-sm">
            <Label htmlFor={htmlFor} className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                {label}
            </Label>
            {children}
        </div>
    )
}

function PrimaryButton({
    onClick,
    children,
}: {
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            className="w-full px-6 py-3 rounded-lg bg-primary text-on-primary font-ui-button text-ui-button uppercase tracking-[0.05em] hover:opacity-90 transition-opacity"
        >
            {children}
        </button>
    )
}

function ResultRow({
    label,
    value,
    inline,
    bold,
}: {
    label: string
    value: string
    inline?: boolean
    bold?: boolean
}) {
    return (
        <div className={cn("flex justify-between items-center", !inline && "p-3 bg-surface-container rounded-lg")}>
            <span className={cn("font-body-md text-body-md text-on-surface-variant", bold && "text-primary font-semibold text-base")}>
                {label}
            </span>
            <span className={cn("font-body-md text-body-md text-primary font-semibold", bold && "font-bold")}>
                {value}
            </span>
        </div>
    )
}

function HighlightResult({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone: "error" | "primary"
}) {
    const toneClass = tone === "error" ? "text-error" : "text-primary"
    return (
        <div className="flex justify-between items-center p-3 rounded-lg border border-outline-variant/30">
            <span className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                {label}
            </span>
            <span className={cn("font-headline-md text-[24px] font-bold", toneClass)}>
                {value}
            </span>
        </div>
    )
}

function MetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="text-center p-3 bg-surface-container rounded-lg">
            <p className="font-body-md text-xs text-on-surface-variant">{label}</p>
            <p className="font-body-md text-body-md text-primary font-semibold mt-1">{value}</p>
        </div>
    )
}

function PlaceholderResult({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="rounded-lg bg-surface-container p-10 text-center flex flex-col items-center gap-stack-md">
            <MaterialIcon name={icon} size={36} className="text-on-surface-variant" />
            <p className="font-body-md text-body-md text-on-surface-variant">{text}</p>
        </div>
    )
}

function Disclaimer() {
    return (
        <p className="font-body-md text-xs text-on-surface-variant text-center">
            {COMMON_DISCLAIMER}
        </p>
    )
}
