"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    Calculator,
    DollarSign,
    Search,
    Calendar,
    PieChart,
    TrendingUp,
    ExternalLink,
    Info,
} from "lucide-react"

interface TaxCalculatorsProps {
    onBack: () => void
}

export default function TaxCalculators({ onBack }: TaxCalculatorsProps) {
    const [activeCalculator, setActiveCalculator] = useState("tax-calculator")
    const [income, setIncome] = useState("")
    const [filingStatus, setFilingStatus] = useState("single")
    const [deductions, setDeductions] = useState("standard")
    const [results, setResults] = useState<any>(null)

    const [refundIncome, setRefundIncome] = useState("")
    const [refundWithheld, setRefundWithheld] = useState("")
    const [refundCredits, setRefundCredits] = useState("")
    const [refundResults, setRefundResults] = useState<any>(null)

    const [quarterlyIncome, setQuarterlyIncome] = useState("")
    const [quarterlyExpenses, setQuarterlyExpenses] = useState("")
    const [quarterlyResults, setQuarterlyResults] = useState<any>(null)

    const [selectedDeductions, setSelectedDeductions] = useState<Record<string, boolean>>({})
    const [deductionResults, setDeductionResults] = useState<any>(null)

    const [withholdingIncome, setWithholdingIncome] = useState("")
    const [withholdingPayPeriods, setWithholdingPayPeriods] = useState("26")
    const [withholdingAllowances, setWithholdingAllowances] = useState("0")
    const [withholdingResults, setWithholdingResults] = useState<any>(null)

    const calculators = [
        {
            id: "tax-calculator",
            title: "Tax Calculator",
            description: "Estimate your federal tax liability",
            icon: <Calculator className="h-5 w-5" />,
        },
        {
            id: "refund-estimator",
            title: "Refund Estimator",
            description: "See your potential tax refund",
            icon: <DollarSign className="h-5 w-5" />,
        },
        {
            id: "deduction-finder",
            title: "Deduction Finder",
            description: "Discover write-offs you might miss",
            icon: <Search className="h-5 w-5" />,
        },
        {
            id: "quarterly-calculator",
            title: "Quarterly Payments",
            description: "Calculate estimated tax payments",
            icon: <Calendar className="h-5 w-5" />,
        },
        {
            id: "withholding-calculator",
            title: "Withholding Calculator",
            description: "Adjust your paycheck withholdings",
            icon: <PieChart className="h-5 w-5" />,
        },
    ]

    const calculateTax = () => {
        const incomeNum = Number.parseFloat(income) || 0

        // 2024 standard deductions
        let standardDeduction = 13850 // Single
        if (filingStatus === "married") standardDeduction = 27700
        if (filingStatus === "head") standardDeduction = 20800

        const taxableIncome = Math.max(0, incomeNum - standardDeduction)

        // 2024 tax brackets
        let tax = 0
        let marginalRate = 0

        if (filingStatus === "single") {
            if (taxableIncome <= 11600) {
                tax = taxableIncome * 0.1
                marginalRate = 10
            } else if (taxableIncome <= 47150) {
                tax = 1160 + (taxableIncome - 11600) * 0.12
                marginalRate = 12
            } else if (taxableIncome <= 100525) {
                tax = 5426 + (taxableIncome - 47150) * 0.22
                marginalRate = 22
            } else if (taxableIncome <= 191950) {
                tax = 17168.5 + (taxableIncome - 100525) * 0.24
                marginalRate = 24
            } else if (taxableIncome <= 243725) {
                tax = 39110.5 + (taxableIncome - 191950) * 0.32
                marginalRate = 32
            } else if (taxableIncome <= 609350) {
                tax = 55678.5 + (taxableIncome - 243725) * 0.35
                marginalRate = 35
            } else {
                tax = 183647.25 + (taxableIncome - 609350) * 0.37
                marginalRate = 37
            }
        } else if (filingStatus === "married") {
            if (taxableIncome <= 23200) {
                tax = taxableIncome * 0.1
                marginalRate = 10
            } else if (taxableIncome <= 94300) {
                tax = 2320 + (taxableIncome - 23200) * 0.12
                marginalRate = 12
            } else if (taxableIncome <= 201050) {
                tax = 10852 + (taxableIncome - 94300) * 0.22
                marginalRate = 22
            } else if (taxableIncome <= 383900) {
                tax = 34337 + (taxableIncome - 201050) * 0.24
                marginalRate = 24
            } else if (taxableIncome <= 487450) {
                tax = 78221 + (taxableIncome - 383900) * 0.32
                marginalRate = 32
            } else if (taxableIncome <= 731200) {
                tax = 111357 + (taxableIncome - 487450) * 0.35
                marginalRate = 35
            } else {
                tax = 196669.5 + (taxableIncome - 731200) * 0.37
                marginalRate = 37
            }
        } else {
            // head of household
            if (taxableIncome <= 16550) {
                tax = taxableIncome * 0.1
                marginalRate = 10
            } else if (taxableIncome <= 63100) {
                tax = 1655 + (taxableIncome - 16550) * 0.12
                marginalRate = 12
            } else if (taxableIncome <= 100500) {
                tax = 7241 + (taxableIncome - 63100) * 0.22
                marginalRate = 22
            } else if (taxableIncome <= 191950) {
                tax = 15469 + (taxableIncome - 100500) * 0.24
                marginalRate = 24
            } else if (taxableIncome <= 243700) {
                tax = 37417 + (taxableIncome - 191950) * 0.32
                marginalRate = 32
            } else if (taxableIncome <= 609350) {
                tax = 53977 + (taxableIncome - 243700) * 0.35
                marginalRate = 35
            } else {
                tax = 181954.5 + (taxableIncome - 609350) * 0.37
                marginalRate = 37
            }
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
        const incomeNum = Number.parseFloat(refundIncome) || 0
        const withheldNum = Number.parseFloat(refundWithheld) || 0
        const creditsNum = Number.parseFloat(refundCredits) || 0

        // Calculate tax liability (simplified)
        const standardDeduction = 13850
        const taxableIncome = Math.max(0, incomeNum - standardDeduction)

        let tax = 0
        if (taxableIncome <= 11600) {
            tax = taxableIncome * 0.1
        } else if (taxableIncome <= 47150) {
            tax = 1160 + (taxableIncome - 11600) * 0.12
        } else if (taxableIncome <= 100525) {
            tax = 5426 + (taxableIncome - 47150) * 0.22
        } else if (taxableIncome <= 191950) {
            tax = 17168.5 + (taxableIncome - 100525) * 0.24
        } else {
            tax = 39110.5 + (taxableIncome - 191950) * 0.32
        }

        const totalTaxLiability = Math.max(0, tax - creditsNum)
        const refund = withheldNum - totalTaxLiability

        setRefundResults({
            taxLiability: totalTaxLiability,
            withheld: withheldNum,
            credits: creditsNum,
            refund: refund,
            owes: refund < 0,
        })
    }

    const calculateQuarterly = () => {
        const incomeNum = Number.parseFloat(quarterlyIncome) || 0
        const expensesNum = Number.parseFloat(quarterlyExpenses) || 0

        const netIncome = incomeNum - expensesNum

        // Self-employment tax (15.3% on 92.35% of net income)
        const selfEmploymentTax = netIncome * 0.9235 * 0.153

        // Income tax on net income minus half of SE tax
        const adjustedIncome = netIncome - selfEmploymentTax / 2
        const standardDeduction = 13850
        const taxableIncome = Math.max(0, adjustedIncome - standardDeduction)

        let incomeTax = 0
        if (taxableIncome <= 11600) {
            incomeTax = taxableIncome * 0.1
        } else if (taxableIncome <= 47150) {
            incomeTax = 1160 + (taxableIncome - 11600) * 0.12
        } else if (taxableIncome <= 100525) {
            incomeTax = 5426 + (taxableIncome - 47150) * 0.22
        } else {
            incomeTax = 17168.5 + (taxableIncome - 100525) * 0.24
        }

        const totalTax = incomeTax + selfEmploymentTax
        const quarterlyPayment = totalTax / 4

        setQuarterlyResults({
            netIncome,
            selfEmploymentTax,
            incomeTax,
            totalTax,
            quarterlyPayment,
        })
    }

    const calculateDeductions = () => {
        let totalDeductions = 0
        const selectedItems: string[] = []

        deductionItems.forEach((category) => {
            category.items.forEach((item) => {
                const key = `${category.category}-${item.name}`
                if (selectedDeductions[key]) {
                    selectedItems.push(item.name)
                    // Parse amount and add to total
                    const amountMatch = item.amount.match(/\$?([\d,]+)/)
                    if (amountMatch) {
                        const amount = Number.parseFloat(amountMatch[1].replace(/,/g, ""))
                        totalDeductions += amount
                    }
                }
            })
        })

        const standardDeduction = 13850
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
        const incomeNum = Number.parseFloat(withholdingIncome) || 0
        const payPeriodsNum = Number.parseFloat(withholdingPayPeriods) || 26
        const allowancesNum = Number.parseFloat(withholdingAllowances) || 0

        // Calculate annual tax liability
        const standardDeduction = 13850
        const taxableIncome = Math.max(0, incomeNum - standardDeduction)

        let annualTax = 0
        if (taxableIncome <= 11600) {
            annualTax = taxableIncome * 0.1
        } else if (taxableIncome <= 47150) {
            annualTax = 1160 + (taxableIncome - 11600) * 0.12
        } else if (taxableIncome <= 100525) {
            annualTax = 5426 + (taxableIncome - 47150) * 0.22
        } else {
            annualTax = 17168.5 + (taxableIncome - 100525) * 0.24
        }

        // Adjust for allowances (each allowance reduces withholding)
        const allowanceReduction = allowancesNum * 4300
        const adjustedTax = Math.max(0, annualTax - allowanceReduction * 0.12)

        const perPaycheck = adjustedTax / payPeriodsNum
        const monthlyWithholding = adjustedTax / 12

        setWithholdingResults({
            annualTax: adjustedTax,
            perPaycheck,
            monthlyWithholding,
            payPeriods: payPeriodsNum,
            allowances: allowancesNum,
        })
    }

    const deductionItems = [
        {
            category: "Home & Property",
            items: [
                { name: "Mortgage Interest", amount: "Up to $750,000 loan", common: true },
                { name: "Property Taxes", amount: "Up to $10,000", common: true },
                { name: "Home Office", amount: "$5 per sq ft (max $1,500)", common: false },
                { name: "Energy Efficient Improvements", amount: "Up to $3,200", common: false },
            ],
        },
        {
            category: "Medical & Health",
            items: [
                { name: "Medical Expenses", amount: "> 7.5% of AGI", common: false },
                { name: "Health Insurance Premiums", amount: "Self-employed", common: false },
                { name: "HSA Contributions", amount: "Up to $4,150", common: true },
                { name: "Long-term Care Insurance", amount: "Age-based limits", common: false },
            ],
        },
        {
            category: "Education",
            items: [
                { name: "Student Loan Interest", amount: "Up to $2,500", common: true },
                { name: "Tuition & Fees", amount: "Varies", common: false },
                { name: "American Opportunity Credit", amount: "Up to $2,500", common: true },
                { name: "Lifetime Learning Credit", amount: "Up to $2,000", common: true },
                { name: "Educator Expenses", amount: "Up to $300", common: false },
            ],
        },
        {
            category: "Charitable & Other",
            items: [
                { name: "Charitable Donations", amount: "Up to 60% AGI", common: true },
                { name: "State & Local Taxes", amount: "Up to $10,000", common: true },
                { name: "Business Expenses", amount: "Self-employed", common: false },
                { name: "Job Search Expenses", amount: "Varies", common: false },
            ],
        },
        {
            category: "Retirement & Investments",
            items: [
                { name: "Traditional IRA Contributions", amount: "Up to $7,000", common: true },
                { name: "401(k) Contributions", amount: "Up to $23,000", common: true },
                { name: "SEP IRA (Self-employed)", amount: "Up to $69,000", common: false },
                { name: "Investment Interest", amount: "Limited to investment income", common: false },
            ],
        },
        {
            category: "Family & Dependents",
            items: [
                { name: "Child Tax Credit", amount: "Up to $2,000 per child", common: true },
                { name: "Child & Dependent Care", amount: "Up to $3,000", common: true },
                { name: "Adoption Credit", amount: "Up to $15,950", common: false },
                { name: "Earned Income Tax Credit", amount: "Income-based", common: true },
            ],
        },
    ]

    const toggleDeduction = (category: string, itemName: string) => {
        const key = `${category}-${itemName}`
        setSelectedDeductions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Tax Optimization Tools</h1>
                    <p className="text-muted-foreground">Calculators and tools to maximize your refund</p>
                </div>
            </div>

            {/* Advertisement Space */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 hidden">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                            <div>
                                <h3 className="font-semibold">Tax Planning Services</h3>
                                <p className="text-sm text-muted-foreground">Professional tax strategy consultation</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline">
                            Get Started <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Calculator Navigation */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Tax Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="space-y-1">
                                {calculators.map((calc) => (
                                    <button
                                        key={calc.id}
                                        onClick={() => setActiveCalculator(calc.id)}
                                        className={`w-full text-left p-3 hover:bg-muted transition-colors ${
                                            activeCalculator === calc.id ? "bg-muted border-r-2 border-primary" : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-primary">{calc.icon}</div>
                                            <div>
                                                <div className="font-medium text-sm">{calc.title}</div>
                                                <div className="text-xs text-muted-foreground">{calc.description}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Calculator Content */}
                <div className="lg:col-span-3">
                    {/* Tax Calculator */}
                    {activeCalculator === "tax-calculator" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Federal Tax Calculator</CardTitle>
                                <CardDescription>Estimate your federal income tax liability for 2024</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="income">Annual Income</Label>
                                            <Input
                                                id="income"
                                                placeholder="$75,000"
                                                value={income}
                                                onChange={(e) => setIncome(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Filing Status</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <Button
                                                    variant={filingStatus === "single" ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setFilingStatus("single")}
                                                >
                                                    Single
                                                </Button>
                                                <Button
                                                    variant={filingStatus === "married" ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setFilingStatus("married")}
                                                >
                                                    Married
                                                </Button>
                                                <Button
                                                    variant={filingStatus === "head" ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setFilingStatus("head")}
                                                >
                                                    Head
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Deduction Type</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant={deductions === "standard" ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setDeductions("standard")}
                                                >
                                                    Standard
                                                </Button>
                                                <Button
                                                    variant={deductions === "itemized" ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setDeductions("itemized")}
                                                >
                                                    Itemized
                                                </Button>
                                            </div>
                                        </div>

                                        <Button onClick={calculateTax} className="w-full">
                                            Calculate Tax
                                        </Button>
                                    </div>

                                    {results && (
                                        <div className="space-y-4">
                                            <h3 className="font-semibold">Tax Calculation Results</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                    <span>Gross Income</span>
                                                    <span className="font-semibold">${results.grossIncome.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                    <span>Standard Deduction</span>
                                                    <span className="font-semibold">${results.standardDeduction.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                    <span>Taxable Income</span>
                                                    <span className="font-semibold">${results.taxableIncome.toLocaleString()}</span>
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                                    <span className="font-semibold">Estimated Tax</span>
                                                    <span className="text-2xl font-bold text-red-600">
                            ${results.estimatedTax.toFixed(0).toLocaleString()}
                          </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="text-center p-2 bg-blue-50 rounded">
                                                        <div className="text-sm text-muted-foreground">Effective Rate</div>
                                                        <div className="font-semibold">{results.effectiveRate.toFixed(1)}%</div>
                                                    </div>
                                                    <div className="text-center p-2 bg-blue-50 rounded">
                                                        <div className="text-sm text-muted-foreground">Marginal Rate</div>
                                                        <div className="font-semibold">{results.marginalRate}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Refund Estimator */}
                    {activeCalculator === "refund-estimator" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Tax Refund Estimator</CardTitle>
                                <CardDescription>Estimate your potential tax refund</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="refundIncome">Total Income</Label>
                                            <Input
                                                id="refundIncome"
                                                placeholder="$65,000"
                                                value={refundIncome}
                                                onChange={(e) => setRefundIncome(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="refundWithheld">Federal Tax Withheld</Label>
                                            <Input
                                                id="refundWithheld"
                                                placeholder="$8,500"
                                                value={refundWithheld}
                                                onChange={(e) => setRefundWithheld(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="refundCredits">Tax Credits</Label>
                                            <Input
                                                id="refundCredits"
                                                placeholder="$2,000"
                                                value={refundCredits}
                                                onChange={(e) => setRefundCredits(e.target.value)}
                                            />
                                        </div>
                                        <Button className="w-full" onClick={calculateRefund}>
                                            Calculate Refund
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        {refundResults ? (
                                            <>
                                                <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
                                                    <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-2" />
                                                    <div
                                                        className={`text-3xl font-bold ${refundResults.owes ? "text-red-600" : "text-green-600"}`}
                                                    >
                                                        {refundResults.owes ? "-" : ""}${Math.abs(refundResults.refund).toFixed(0).toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-green-700">
                                                        {refundResults.owes ? "Amount Owed" : "Estimated Refund"}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between p-2 bg-muted rounded">
                                                        <span className="text-sm">Tax Liability</span>
                                                        <span className="text-sm font-semibold">
                              ${refundResults.taxLiability.toFixed(0).toLocaleString()}
                            </span>
                                                    </div>
                                                    <div className="flex justify-between p-2 bg-muted rounded">
                                                        <span className="text-sm">Tax Withheld</span>
                                                        <span className="text-sm font-semibold">
                              ${refundResults.withheld.toFixed(0).toLocaleString()}
                            </span>
                                                    </div>
                                                    <div className="flex justify-between p-2 bg-muted rounded">
                                                        <span className="text-sm">Tax Credits</span>
                                                        <span className="text-sm font-semibold">
                              ${refundResults.credits.toFixed(0).toLocaleString()}
                            </span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-6 bg-muted rounded-lg">
                                                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    Enter your information and click Calculate Refund
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground text-center">
                                            This is an estimate. Actual refund may vary based on your complete tax situation.
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Deduction Finder */}
                    {activeCalculator === "deduction-finder" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Deduction Finder</CardTitle>
                                <CardDescription>Discover tax deductions you might be missing</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {deductionItems.map((category, index) => (
                                        <div key={index}>
                                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                {category.category}
                                            </h3>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {category.items.map((item, itemIndex) => {
                                                    const key = `${category.category}-${item.name}`
                                                    return (
                                                        <Card key={itemIndex} className="hover:shadow-md transition-shadow">
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <h4 className="font-medium text-sm">{item.name}</h4>
                                                                    {item.common && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Common
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mb-3">{item.amount}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded"
                                                                        checked={selectedDeductions[key] || false}
                                                                        onChange={() => toggleDeduction(category.category, item.name)}
                                                                    />
                                                                    <span className="text-xs">I have this</span>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {deductionResults && (
                                        <Card className="bg-blue-50 border-blue-200">
                                            <CardContent className="p-6">
                                                <h3 className="font-semibold mb-4 text-lg">Your Deduction Summary</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span>Selected Deductions</span>
                                                        <span className="font-semibold">{deductionResults.selectedCount} items</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span>Total Itemized Deductions</span>
                                                        <span className="font-semibold">${deductionResults.totalItemized.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span>Standard Deduction</span>
                                                        <span className="font-semibold">
                              ${deductionResults.standardDeduction.toLocaleString()}
                            </span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                                                        <span className="font-semibold">Recommendation</span>
                                                        <span className="font-bold text-primary">
                              {deductionResults.shouldItemize ? "Itemize" : "Take Standard"}
                            </span>
                                                    </div>
                                                    {deductionResults.shouldItemize && (
                                                        <div className="text-center p-3 bg-green-100 rounded-lg">
                                                            <p className="text-sm font-semibold text-green-800">
                                                                You could save an extra ${deductionResults.savings.toLocaleString()} by itemizing!
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="text-center pt-4">
                                        <Button onClick={calculateDeductions}>Calculate My Deductions</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quarterly Calculator */}
                    {activeCalculator === "quarterly-calculator" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Quarterly Tax Payment Calculator</CardTitle>
                                <CardDescription>Calculate estimated tax payments for self-employed individuals</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="quarterlyIncome">Expected Annual Income</Label>
                                            <Input
                                                id="quarterlyIncome"
                                                placeholder="$80,000"
                                                value={quarterlyIncome}
                                                onChange={(e) => setQuarterlyIncome(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="quarterlyExpenses">Business Expenses</Label>
                                            <Input
                                                id="quarterlyExpenses"
                                                placeholder="$15,000"
                                                value={quarterlyExpenses}
                                                onChange={(e) => setQuarterlyExpenses(e.target.value)}
                                            />
                                        </div>
                                        {quarterlyResults && (
                                            <div className="space-y-2">
                                                <Label>Self-Employment Tax</Label>
                                                <Input value={`$${quarterlyResults.selfEmploymentTax.toFixed(0).toLocaleString()}`} disabled />
                                            </div>
                                        )}
                                        <Button className="w-full" onClick={calculateQuarterly}>
                                            Calculate Quarterly Payments
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        {quarterlyResults ? (
                                            <>
                                                <div className="space-y-2 p-4 bg-muted rounded-lg">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm">Net Income</span>
                                                        <span className="text-sm font-semibold">
                              ${quarterlyResults.netIncome.toLocaleString()}
                            </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm">Income Tax</span>
                                                        <span className="text-sm font-semibold">
                              ${quarterlyResults.incomeTax.toFixed(0).toLocaleString()}
                            </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm">SE Tax</span>
                                                        <span className="text-sm font-semibold">
                              ${quarterlyResults.selfEmploymentTax.toFixed(0).toLocaleString()}
                            </span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between">
                                                        <span className="font-semibold">Total Annual Tax</span>
                                                        <span className="font-bold">${quarterlyResults.totalTax.toFixed(0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <h3 className="font-semibold">2024 Payment Schedule</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                                        <div>
                                                            <div className="font-medium">Q1 2024</div>
                                                            <div className="text-sm text-muted-foreground">Due: April 15</div>
                                                        </div>
                                                        <div className="font-semibold">
                                                            ${quarterlyResults.quarterlyPayment.toFixed(0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                                        <div>
                                                            <div className="font-medium">Q2 2024</div>
                                                            <div className="text-sm text-muted-foreground">Due: June 17</div>
                                                        </div>
                                                        <div className="font-semibold">
                                                            ${quarterlyResults.quarterlyPayment.toFixed(0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                                        <div>
                                                            <div className="font-medium">Q3 2024</div>
                                                            <div className="text-sm text-muted-foreground">Due: September 16</div>
                                                        </div>
                                                        <div className="font-semibold">
                                                            ${quarterlyResults.quarterlyPayment.toFixed(0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                                        <div>
                                                            <div className="font-medium">Q4 2024</div>
                                                            <div className="text-sm text-muted-foreground">Due: January 15, 2025</div>
                                                        </div>
                                                        <div className="font-semibold">
                                                            ${quarterlyResults.quarterlyPayment.toFixed(0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-12 bg-muted rounded-lg">
                                                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">Enter your income and expenses to calculate</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Withholding Calculator */}
                    {activeCalculator === "withholding-calculator" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Withholding Calculator</CardTitle>
                                <CardDescription>Adjust your paycheck withholdings to avoid a big tax bill or refund</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="withholdingIncome">Annual Salary</Label>
                                                <Input
                                                    id="withholdingIncome"
                                                    placeholder="$75,000"
                                                    value={withholdingIncome}
                                                    onChange={(e) => setWithholdingIncome(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="withholdingPayPeriods">Pay Periods per Year</Label>
                                                <Input
                                                    id="withholdingPayPeriods"
                                                    placeholder="26 (bi-weekly)"
                                                    value={withholdingPayPeriods}
                                                    onChange={(e) => setWithholdingPayPeriods(e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground">Weekly: 52, Bi-weekly: 26, Monthly: 12</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="withholdingAllowances">W-4 Allowances</Label>
                                                <Input
                                                    id="withholdingAllowances"
                                                    placeholder="0"
                                                    value={withholdingAllowances}
                                                    onChange={(e) => setWithholdingAllowances(e.target.value)}
                                                />
                                            </div>
                                            <Button className="w-full" onClick={calculateWithholding}>
                                                Calculate Withholding
                                            </Button>
                                        </div>
                                        <div className="space-y-4">
                                            {withholdingResults ? (
                                                <>
                                                    <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                                                        <PieChart className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                                                        <div className="text-3xl font-bold text-blue-600">
                                                            ${withholdingResults.perPaycheck.toFixed(0).toLocaleString()}
                                                        </div>
                                                        <div className="text-sm text-blue-700">Per Paycheck</div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                                                            <span>Annual Tax</span>
                                                            <span className="font-semibold">
                                ${withholdingResults.annualTax.toFixed(0).toLocaleString()}
                              </span>
                                                        </div>
                                                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                                                            <span>Monthly Withholding</span>
                                                            <span className="font-semibold">
                                ${withholdingResults.monthlyWithholding.toFixed(0).toLocaleString()}
                              </span>
                                                        </div>
                                                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                                                            <span>Pay Periods</span>
                                                            <span className="font-semibold">{withholdingResults.payPeriods}</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <p className="text-sm text-yellow-800">
                                                            <strong>Tip:</strong> If you're getting large refunds, increase your allowances. If you
                                                            owe money, decrease them.
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-12 bg-muted rounded-lg">
                                                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                                    <p className="text-sm text-muted-foreground">Enter your information to calculate</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            About W-4 Withholding
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Your W-4 form tells your employer how much federal tax to withhold from your paycheck. Adjust it
                                            to match your tax situation and avoid owing money or getting a large refund at tax time.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
