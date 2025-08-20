"use client"

import { useState } from "react"
import { Calculator, ArrowLeft, Share2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function LoanCalculator() {
  const [calculationType, setCalculationType] = useState("payment")

  // Payment Calculator States
  const [loanAmount, setLoanAmount] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [loanTerm, setLoanTerm] = useState("")

  // APR Calculator States
  const [loanAmountAPR, setLoanAmountAPR] = useState("")
  const [totalInterest, setTotalInterest] = useState("")
  const [fees, setFees] = useState("")
  const [termAPR, setTermAPR] = useState("")

  // Loan Amount Calculator States
  const [monthlyPayment, setMonthlyPayment] = useState("")
  const [rateForAmount, setRateForAmount] = useState("")
  const [termForAmount, setTermForAmount] = useState("")

  // Remaining Balance Calculator States
  const [originalAmount, setOriginalAmount] = useState("")
  const [originalRate, setOriginalRate] = useState("")
  const [originalTerm, setOriginalTerm] = useState("")
  const [paymentsMade, setPaymentsMade] = useState("")

  const [loanType, setLoanType] = useState("personal")
  const [paymentFrequency, setPaymentFrequency] = useState("monthly")
  const [extraPayment, setExtraPayment] = useState("")
  const [downPayment, setDownPayment] = useState("")
  const [result, setResult] = useState<any>(null)

  const calculatePayment = () => {
    const principal = (Number.parseFloat(loanAmount) || 0) - (Number.parseFloat(downPayment) || 0)
    const annualRate = (Number.parseFloat(interestRate) || 0) / 100
    const termMonths = Number.parseFloat(loanTerm) || 0
    const extra = Number.parseFloat(extraPayment) || 0

    const frequencies = {
      monthly: { periods: 12, termPeriods: termMonths },
      biweekly: { periods: 26, termPeriods: termMonths * 2.17 },
      weekly: { periods: 52, termPeriods: termMonths * 4.33 },
      quarterly: { periods: 4, termPeriods: termMonths / 3 },
      annually: { periods: 1, termPeriods: termMonths / 12 },
    }

    const freq = frequencies[paymentFrequency]
    const rate = annualRate / freq.periods
    const term = freq.termPeriods

    // Updated validation to allow zero interest and zero principal
    if (principal < 0 || term <= 0) {
      setResult({ error: "Please enter valid positive numbers for Loan Amount and Term." })
      return
    }

    let basePayment = 0;
    // Special calculation for 0% interest rate
    if (rate === 0) {
      if (term > 0) {
        basePayment = principal / term;
      }
    } else {
      // Standard loan payment formula
      basePayment = (principal * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)
    }

    // Ensure basePayment is a valid number, otherwise set to 0.
    if (!isFinite(basePayment)) {
      basePayment = 0;
    }

    const totalPayment = basePayment * term
    const totalInterest = totalPayment - principal

    setResult({
      type: "payment",
      basePayment,
      totalPayment,
      totalInterest,
      principal,
      paymentFrequency,
      downPayment: Number.parseFloat(downPayment) || 0,
    })
  }

  const calculateAPR = () => {
    const principal = Number.parseFloat(loanAmountAPR) || 0
    const interest = Number.parseFloat(totalInterest) || 0
    const totalFees = Number.parseFloat(fees) || 0
    const term = Number.parseFloat(termAPR) || 0

    if (principal <= 0 || term <= 0) {
      setResult({ error: "Please enter valid positive numbers" })
      return
    }

    const totalCost = interest + totalFees
    const apr = (totalCost / principal / term) * 100

    setResult({
      type: "apr",
      apr,
      totalCost,
      principal,
      term,
    })
  }

  const calculateLoanAmount = () => {
    const payment = Number.parseFloat(monthlyPayment) || 0
    const rate = (Number.parseFloat(rateForAmount) || 0) / 100 / 12
    const term = Number.parseFloat(termForAmount) || 0

    if (payment <= 0 || rate < 0 || term <= 0) {
      setResult({ error: "Please enter valid positive numbers" })
      return
    }

    const maxLoanAmount = payment * ((1 - Math.pow(1 + rate, -term)) / rate)

    setResult({
      type: "loanAmount",
      maxLoanAmount,
      payment,
      rate: Number.parseFloat(rateForAmount),
      term,
    })
  }

  const calculateRemainingBalance = () => {
    const principal = Number.parseFloat(originalAmount) || 0
    const rate = (Number.parseFloat(originalRate) || 0) / 100 / 12
    const term = Number.parseFloat(originalTerm) || 0
    const payments = Number.parseFloat(paymentsMade) || 0

    if (principal <= 0 || rate < 0 || term <= 0 || payments < 0) {
      setResult({ error: "Please enter valid positive numbers" })
      return
    }

    const monthlyPayment = (principal * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)
    const remainingBalance =
        principal * Math.pow(1 + rate, payments) - monthlyPayment * ((Math.pow(1 + rate, payments) - 1) / rate)
    const remainingPayments = term - payments

    setResult({
      type: "remaining",
      remainingBalance: Math.max(0, remainingBalance),
      remainingPayments: Math.max(0, remainingPayments),
      monthlyPayment,
      totalPaid: monthlyPayment * payments,
    })
  }

  const handleCalculate = () => {
    setResult(null); // Clear previous results before calculating
    switch (calculationType) {
      case "payment":
        calculatePayment()
        break
      case "apr":
        calculateAPR()
        break
      case "loanAmount":
        calculateLoanAmount()
        break
      case "remaining":
        calculateRemainingBalance()
        break
    }
  }

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <Calculator className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">FinnaCalc</span>
                </Link>
              </div>
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900">Loan Calculator</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-blue-600" />
                    Loan Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate payments, APR, loan amounts, and remaining balances for any type of loan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={calculationType} onValueChange={setCalculationType} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
                      <TabsTrigger value="payment" className="text-xs sm:text-sm">
                        Payment
                      </TabsTrigger>
                      <TabsTrigger value="apr" className="text-xs sm:text-sm">
                        APR
                      </TabsTrigger>
                      <TabsTrigger value="loanAmount" className="text-xs sm:text-sm">
                        Loan Amount
                      </TabsTrigger>
                      <TabsTrigger value="remaining" className="text-xs sm:text-sm">
                        Remaining
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="payment" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="loanType">Loan Type</Label>
                          <Select value={loanType} onValueChange={setLoanType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="personal">Personal Loan</SelectItem>
                              <SelectItem value="business">Business Loan</SelectItem>
                              <SelectItem value="auto">Auto Loan</SelectItem>
                              <SelectItem value="mortgage">Mortgage</SelectItem>
                              <SelectItem value="student">Student Loan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="loanAmount">Loan Amount ($)</Label>
                          <Input
                              id="loanAmount"
                              type="number"
                              placeholder="50000"
                              value={loanAmount}
                              onChange={(e) => setLoanAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                          <Input
                              id="interestRate"
                              type="number"
                              step="0.01"
                              placeholder="5.5"
                              value={interestRate}
                              onChange={(e) => setInterestRate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="loanTerm">Loan Term (months)</Label>
                          <Input
                              id="loanTerm"
                              type="number"
                              placeholder="60"
                              value={loanTerm}
                              onChange={(e) => setLoanTerm(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                          <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="downPayment">Down Payment ($)</Label>
                          <Input
                              id="downPayment"
                              type="number"
                              placeholder="5000"
                              value={downPayment}
                              onChange={(e) => setDownPayment(e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="apr" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="loanAmountAPR">Loan Amount ($)</Label>
                          <Input
                              id="loanAmountAPR"
                              type="number"
                              placeholder="50000"
                              value={loanAmountAPR}
                              onChange={(e) => setLoanAmountAPR(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="totalInterest">Total Interest Paid ($)</Label>
                          <Input
                              id="totalInterest"
                              type="number"
                              placeholder="5000"
                              value={totalInterest}
                              onChange={(e) => setTotalInterest(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fees">Total Fees ($)</Label>
                          <Input
                              id="fees"
                              type="number"
                              placeholder="500"
                              value={fees}
                              onChange={(e) => setFees(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="termAPR">Loan Term (years)</Label>
                          <Input
                              id="termAPR"
                              type="number"
                              placeholder="5"
                              value={termAPR}
                              onChange={(e) => setTermAPR(e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="loanAmount" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="monthlyPayment">Monthly Payment ($)</Label>
                          <Input
                              id="monthlyPayment"
                              type="number"
                              placeholder="500"
                              value={monthlyPayment}
                              onChange={(e) => setMonthlyPayment(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="rateForAmount">Annual Interest Rate (%)</Label>
                          <Input
                              id="rateForAmount"
                              type="number"
                              step="0.01"
                              placeholder="5.5"
                              value={rateForAmount}
                              onChange={(e) => setRateForAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="termForAmount">Loan Term (months)</Label>
                          <Input
                              id="termForAmount"
                              type="number"
                              placeholder="60"
                              value={termForAmount}
                              onChange={(e) => setTermForAmount(e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="remaining" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="originalAmount">Original Loan Amount ($)</Label>
                          <Input
                              id="originalAmount"
                              type="number"
                              placeholder="50000"
                              value={originalAmount}
                              onChange={(e) => setOriginalAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="originalRate">Annual Interest Rate (%)</Label>
                          <Input
                              id="originalRate"
                              type="number"
                              step="0.01"
                              placeholder="5.5"
                              value={originalRate}
                              onChange={(e) => setOriginalRate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="originalTerm">Original Term (months)</Label>
                          <Input
                              id="originalTerm"
                              type="number"
                              placeholder="60"
                              value={originalTerm}
                              onChange={(e) => setOriginalTerm(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentsMade">Payments Made</Label>
                          <Input
                              id="paymentsMade"
                              type="number"
                              placeholder="12"
                              value={paymentsMade}
                              onChange={(e) => setPaymentsMade(e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Calculate{" "}
                    {calculationType === "payment"
                        ? "Payment"
                        : calculationType === "apr"
                            ? "APR"
                            : calculationType === "loanAmount"
                                ? "Loan Amount"
                                : "Remaining Balance"}
                  </Button>

                  {result && (
                      <div className="calculator-result space-y-4 mt-6">
                        {result.error ? (
                            <div className="text-red-600 font-semibold p-4 bg-red-50 border border-red-200 rounded-lg">{result.error}</div>
                        ) : (
                            <>
                              <h3 className="text-lg font-semibold text-blue-800">
                                Your{" "}
                                {result.type === "payment"
                                    ? "Payment"
                                    : result.type === "apr"
                                        ? "APR"
                                        : result.type === "loanAmount"
                                            ? "Loan Amount"
                                            : "Remaining Balance"}{" "}
                                Calculation
                              </h3>

                              {result.type === "payment" && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-600">Payment per Period</p>
                                      <p className="text-3xl font-bold text-green-600">${result.basePayment.toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Total Payment</p>
                                      <p className="text-2xl font-bold text-blue-600">
                                        ${result.totalPayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Total Interest</p>
                                      <p className="text-2xl font-bold text-red-600">
                                        ${result.totalInterest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Principal Amount</p>
                                      <p className="text-2xl font-bold text-purple-600">${result.principal.toLocaleString()}</p>
                                    </div>
                                  </div>
                              )}

                              {result.type === "apr" && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-600">Annual Percentage Rate (APR)</p>
                                      <p className="text-3xl font-bold text-green-600">{result.apr.toFixed(2)}%</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Total Cost of Loan</p>
                                      <p className="text-2xl font-bold text-red-600">${result.totalCost.toLocaleString()}</p>
                                    </div>
                                  </div>
                              )}

                              {result.type === "loanAmount" && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-600">Maximum Loan Amount</p>
                                      <p className="text-3xl font-bold text-green-600">
                                        ${result.maxLoanAmount.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Monthly Payment</p>
                                      <p className="text-2xl font-bold text-blue-600">${result.payment.toLocaleString()}</p>
                                    </div>
                                  </div>
                              )}

                              {result.type === "remaining" && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-600">Remaining Balance</p>
                                      <p className="text-3xl font-bold text-green-600">
                                        ${result.remainingBalance.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Remaining Payments</p>
                                      <p className="text-2xl font-bold text-blue-600">{result.remainingPayments}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Total Paid So Far</p>
                                      <p className="text-2xl font-bold text-purple-600">${result.totalPaid.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Monthly Payment</p>
                                      <p className="text-2xl font-bold text-orange-600">${result.monthlyPayment.toFixed(2)}</p>
                                    </div>
                                  </div>
                              )}

                              <div className="flex gap-2 pt-4">
                                <Button variant="outline" className="flex items-center gap-2">
                                  <Share2 className="h-4 w-4" />
                                  Share Results
                                </Button>
                                <Button variant="outline" className="flex items-center gap-2">
                                  <Download className="h-4 w-4" />
                                  Download Report
                                </Button>
                              </div>
                            </>
                        )}
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="ad-space">
                <p>Advertisement</p>
                <p className="text-sm">Best Loan Rates - Compare Now</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Find Better Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Compare loan offers from top lenders</p>
                  <Button className="w-full bg-green-600 hover:bg-green-700">Compare Loan Rates</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Calculators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link href="/mortgage-calculator" className="block p-2 hover:bg-gray-50 rounded">
                      <p className="font-medium">Mortgage Calculator</p>
                      <p className="text-sm text-gray-600">Calculate home loan payments</p>
                    </Link>
                    <Link href="/auto-loan-calculator" className="block p-2 hover:bg-gray-50 rounded">
                      <p className="font-medium">Auto Loan Calculator</p>
                      <p className="text-sm text-gray-600">Calculate car loan payments</p>
                    </Link>
                    <Link href="/debt-consolidation-calculator" className="block p-2 hover:bg-gray-50 rounded">
                      <p className="font-medium">Debt Consolidation</p>
                      <p className="text-sm text-gray-600">Compare consolidation options</p>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* SEO Content */}
          <div className="mt-12 prose max-w-none">
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
                <strong>Payment Calculator:</strong> Calculate monthly payments based on loan amount, interest rate, and
                term
              </li>
              <li>
                <strong>APR Calculator:</strong> Determine the true annual percentage rate including fees
              </li>
              <li>
                <strong>Loan Amount Calculator:</strong> Find out how much you can borrow based on your budget
              </li>
              <li>
                <strong>Remaining Balance:</strong> Calculate how much you still owe on an existing loan
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