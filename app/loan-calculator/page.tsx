"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoanCalculator } from "@/hooks/use-loan-calculator"
import type { CalculationMode } from "@/lib/types/loan"
import { AprForm } from "./_components/apr-form"
import { LoanAmountForm } from "./_components/loan-amount-form"
import { PaymentForm } from "./_components/payment-form"
import { RemainingForm } from "./_components/remaining-form"
import { FormErrorBanner, ResultDisplay } from "./_components/result-display"

const MODE_LABEL: Record<CalculationMode, string> = {
    payment: "Payment",
    apr: "APR",
    loanAmount: "Loan Amount",
    remaining: "Remaining Balance",
}

export default function LoanCalculatorPage() {
    const router = useRouter()
    const calculator = useLoanCalculator()
    const formError = calculator.errors._form

    return (
        <div className="min-h-screen bg-muted/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            Loan Calculator
                        </CardTitle>
                        <CardDescription>
                            Calculate payments, APR, loan amounts, and remaining balances for any type of loan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs
                            value={calculator.mode}
                            onValueChange={(value) => calculator.setMode(value as CalculationMode)}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
                                <TabsTrigger value="payment" className="text-xs sm:text-sm">Payment</TabsTrigger>
                                <TabsTrigger value="apr" className="text-xs sm:text-sm">APR</TabsTrigger>
                                <TabsTrigger value="loanAmount" className="text-xs sm:text-sm">Loan Amount</TabsTrigger>
                                <TabsTrigger value="remaining" className="text-xs sm:text-sm">Remaining</TabsTrigger>
                            </TabsList>

                            <TabsContent value="payment" className="space-y-6">
                                <PaymentForm
                                    value={calculator.payment}
                                    onChange={calculator.setPayment}
                                    loanType={calculator.loanType}
                                    onLoanTypeChange={calculator.setLoanType}
                                    errors={calculator.errors}
                                />
                            </TabsContent>

                            <TabsContent value="apr" className="space-y-6">
                                <AprForm
                                    value={calculator.apr}
                                    onChange={calculator.setApr}
                                    errors={calculator.errors}
                                />
                            </TabsContent>

                            <TabsContent value="loanAmount" className="space-y-6">
                                <LoanAmountForm
                                    value={calculator.loanAmount}
                                    onChange={calculator.setLoanAmount}
                                    errors={calculator.errors}
                                />
                            </TabsContent>

                            <TabsContent value="remaining" className="space-y-6">
                                <RemainingForm
                                    value={calculator.remaining}
                                    onChange={calculator.setRemaining}
                                    errors={calculator.errors}
                                />
                            </TabsContent>
                        </Tabs>

                        <Button
                            onClick={calculator.calculate}
                            className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                            size="lg"
                        >
                            Calculate {MODE_LABEL[calculator.mode]}
                        </Button>

                        {formError && (
                            <div className="mt-6">
                                <FormErrorBanner message={formError} />
                            </div>
                        )}

                        {calculator.result && !formError && (
                            <div className="calculator-result mt-6">
                                <ResultDisplay result={calculator.result} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-12 prose dark:prose-invert max-w-none">
                    <h2>How to Use the Loan Calculator</h2>
                    <p>
                        Our comprehensive loan calculator helps you determine monthly payments, APR, maximum loan amounts, and
                        remaining balances for various types of loans including personal loans, business loans, auto loans,
                        mortgages, and student loans. Understanding your loan details is crucial for budgeting and financial
                        planning.
                    </p>

                    <h3>Calculator Features</h3>
                    <ul>
                        <li>
                            <strong>Payment Calculator:</strong> Calculate periodic payments based on loan amount, interest rate, and term.
                        </li>
                        <li>
                            <strong>APR Calculator:</strong> Determine the true annual percentage rate including fees.
                        </li>
                        <li>
                            <strong>Loan Amount Calculator:</strong> Find out how much you can borrow based on your budget.
                        </li>
                        <li>
                            <strong>Remaining Balance:</strong> Calculate how much you still owe on an existing loan.
                        </li>
                    </ul>

                    <h3>Factors That Affect Your Loan</h3>
                    <p>
                        Your loan terms depend on several factors: the loan amount (principal), the interest rate, the loan term,
                        and any additional fees. Generally, longer terms result in lower monthly payments but higher total interest
                        costs. Understanding APR helps you compare loans with different fee structures.
                    </p>
                </div>
            </div>
        </div>
    )
}
