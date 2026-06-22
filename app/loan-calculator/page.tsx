"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalculatorPageShell } from "@/components/ds/calculator-page-shell"
import {
    FormErrorBanner,
    ResultEmptyState,
} from "@/components/ds/calculator-result"
import { useLoanCalculator } from "@/hooks/use-loan-calculator"
import type { CalculationMode } from "@/lib/types/loan"
import { AprForm } from "./_components/apr-form"
import { LoanAmountForm } from "./_components/loan-amount-form"
import { LoanChart } from "./_components/loan-chart"
import { LoanFormula } from "./_components/loan-formula"
import { LOAN_FAQ, LoanEducation } from "./_components/loan-content"
import { PaymentForm } from "./_components/payment-form"
import { RemainingForm } from "./_components/remaining-form"
import { ResultDisplay } from "./_components/result-display"

const MODE_LABEL: Record<CalculationMode, string> = {
    payment: "Payment",
    apr: "APR",
    loanAmount: "Loan Amount",
    remaining: "Remaining",
}

const MODE_EMPTY_STATE: Record<CalculationMode, { title: string; description: string }> = {
    payment: {
        title: "Your payment will appear here",
        description:
            "Enter the loan amount, rate, and term — we'll compute the periodic payment and total interest over the life of the loan.",
    },
    apr: {
        title: "APR estimate will appear here",
        description:
            "Enter the principal, total interest paid, fees, and term — we'll return the simple-interest APR approximation.",
    },
    loanAmount: {
        title: "Maximum loan amount will appear here",
        description:
            "Enter what you can afford monthly along with rate and term — we'll invert the PMT formula to find the largest loan that fits.",
    },
    remaining: {
        title: "Remaining balance will appear here",
        description:
            "Enter the original loan terms and how many payments you've made — we'll compute the outstanding balance and payments left.",
    },
}

export default function LoanCalculatorPage() {
    const calculator = useLoanCalculator()
    const formError = calculator.errors._form
    const showChart =
        calculator.mode === "payment" &&
        calculator.result !== null &&
        calculator.result.kind === "payment"

    const form = (
        <div className="flex flex-col gap-stack-lg p-10">
            <Tabs
                value={calculator.mode}
                onValueChange={(value) => calculator.setMode(value as CalculationMode)}
            >
                <TabsList>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                    <TabsTrigger value="apr">APR</TabsTrigger>
                    <TabsTrigger value="loanAmount">Loan Amount</TabsTrigger>
                    <TabsTrigger value="remaining">Remaining</TabsTrigger>
                </TabsList>

                <TabsContent value="payment" className="pt-stack-lg">
                    <PaymentForm
                        value={calculator.payment}
                        onChange={calculator.setPayment}
                        loanType={calculator.loanType}
                        onLoanTypeChange={calculator.setLoanType}
                        errors={calculator.errors}
                    />
                </TabsContent>
                <TabsContent value="apr" className="pt-stack-lg">
                    <AprForm
                        value={calculator.apr}
                        onChange={calculator.setApr}
                        errors={calculator.errors}
                    />
                </TabsContent>
                <TabsContent value="loanAmount" className="pt-stack-lg">
                    <LoanAmountForm
                        value={calculator.loanAmount}
                        onChange={calculator.setLoanAmount}
                        errors={calculator.errors}
                    />
                </TabsContent>
                <TabsContent value="remaining" className="pt-stack-lg">
                    <RemainingForm
                        value={calculator.remaining}
                        onChange={calculator.setRemaining}
                        errors={calculator.errors}
                    />
                </TabsContent>
            </Tabs>

            <div className="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant/20">
                {formError ? <FormErrorBanner message={formError} /> : null}
                <Button onClick={calculator.calculate} size="lg" className="w-full">
                    Calculate {MODE_LABEL[calculator.mode]}
                </Button>
            </div>
        </div>
    )

    const result =
        calculator.result && !formError ? (
            <ResultDisplay result={calculator.result} />
        ) : (
            <ResultEmptyState
                title={MODE_EMPTY_STATE[calculator.mode].title}
                description={MODE_EMPTY_STATE[calculator.mode].description}
                icon="calculate"
            />
        )

    return (
        <CalculatorPageShell
            eyebrow="Loans"
            title="Loan Calculator"
            description="Solve for payment, APR, maximum loan amount, or remaining balance with deterministic, decimal-safe math."
            category="Loans"
            estimatedMinutes={2}
            backHref="/"
            form={form}
            result={result}
            chart={showChart ? <LoanChart paymentForm={calculator.payment} /> : null}
            formula={{
                eyebrow: "Formula",
                title: "The math behind the result",
                children: <LoanFormula mode={calculator.mode} />,
            }}
            education={{
                eyebrow: "Background",
                title: "How to think about loans",
                children: <LoanEducation />,
            }}
            faq={{
                eyebrow: "FAQ",
                title: "Common loan questions",
                description:
                    "Answers to the questions that come up most when people work through these calculations.",
                items: LOAN_FAQ,
            }}
        />
    )
}
