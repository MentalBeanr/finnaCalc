"use client"

import { useState } from "react"
import { Calculator, Share2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EmergencyFundCalculator() {
  const [monthlyExpenses, setMonthlyExpenses] = useState("")
  const [currentSavings, setCurrentSavings] = useState("")
  const [targetType, setTargetType] = useState("months")
  const [targetValue, setTargetValue] = useState("6")
  const [result, setResult] = useState<any>(null)
  const [monthlySavings, setMonthlySavings] = useState("")
  const [interestRate, setInterestRate] = useState("4.5")
  const [savingsGoal, setSavingsGoal] = useState("emergency")

  const calculateEmergencyFund = () => {
    const expenses = Number.parseFloat(monthlyExpenses) || 0
    const savings = Number.parseFloat(currentSavings) || 0
    const value = Number.parseFloat(targetValue) || 0
    const monthlyContribution = Number.parseFloat(monthlySavings) || 0
    const rate = Number.parseFloat(interestRate) || 0

    // Calculate target amount based on selected type
    const targetAmount =
        targetType === "months"
            ? expenses * value // value is months
            : value // value is dollar amount

    const months = targetType === "months" ? value : targetAmount / expenses

    const stillNeeded = Math.max(0, targetAmount - savings)
    const percentComplete = savings > 0 ? (savings / targetAmount) * 100 : 0

    // Calculate time to reach goal with monthly contributions and interest
    let timeToGoal = 0
    if (monthlyContribution > 0 && stillNeeded > 0) {
      const monthlyRate = rate / 100 / 12
      if (monthlyRate > 0) {
        timeToGoal = Math.log(1 + (stillNeeded * monthlyRate) / monthlyContribution) / Math.log(1 + monthlyRate)
      } else {
        timeToGoal = stillNeeded / monthlyContribution
      }
    }

    setResult({
      targetAmount,
      stillNeeded,
      percentComplete: Math.min(100, percentComplete),
      monthsOfExpensesCovered: savings > 0 ? savings / expenses : 0,
      timeToGoal: Math.ceil(timeToGoal),
      monthlyContribution,
      projectedInterest: stillNeeded * (rate / 100) * (timeToGoal / 12),
      targetMonths: months,
    })
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900">Emergency Fund Calculator</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calculator */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-blue-600" />
                    Emergency Fund Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate how much you need in your emergency fund and track your progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monthlyExpenses">Monthly Expenses ($)</Label>
                      <Input
                          id="monthlyExpenses"
                          type="number"
                          placeholder="5000"
                          value={monthlyExpenses}
                          onChange={(e) => setMonthlyExpenses(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentSavings">Current Emergency Savings ($)</Label>
                      <Input
                          id="currentSavings"
                          type="number"
                          placeholder="10000"
                          value={currentSavings}
                          onChange={(e) => setCurrentSavings(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetType">Target Type</Label>
                      <Select value={targetType} onValueChange={setTargetType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="months">Target Months of Expenses</SelectItem>
                          <SelectItem value="amount">Target Savings Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="targetValue">
                        {targetType === "months" ? "Number of Months" : "Target Amount ($)"}
                      </Label>
                      <Input
                          id="targetValue"
                          type="number"
                          placeholder={targetType === "months" ? "6" : "30000"}
                          value={targetValue}
                          onChange={(e) => setTargetValue(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {targetType === "months"
                            ? "Recommended: 3-6 months for most people"
                            : "Enter your desired emergency fund amount"}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="monthlySavings">Monthly Savings Amount ($)</Label>
                      <Input
                          id="monthlySavings"
                          type="number"
                          placeholder="500"
                          value={monthlySavings}
                          onChange={(e) => setMonthlySavings(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentInterestRate">Savings Account Interest Rate (%)</Label>
                      <Input
                          id="currentInterestRate"
                          type="number"
                          step="0.01"
                          placeholder="4.5"
                          value={interestRate}
                          onChange={(e) => setInterestRate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="savingsGoal">Specific Savings Goal (Optional)</Label>
                      <Select value={savingsGoal} onValueChange={setSavingsGoal}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emergency">Emergency Fund</SelectItem>
                          <SelectItem value="vacation">Vacation Fund</SelectItem>
                          <SelectItem value="home">Home Down Payment</SelectItem>
                          <SelectItem value="car">Car Purchase</SelectItem>
                          <SelectItem value="other">Other Goal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={calculateEmergencyFund} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Calculate Emergency Fund
                  </Button>

                  {result && (
                      <div className="calculator-result space-y-4">
                        <h3 className="text-lg font-semibold text-blue-800">Your Emergency Fund Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Target Emergency Fund</p>
                            <p className="text-2xl font-bold text-green-600">${result.targetAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Still Need to Save</p>
                            <p className="text-2xl font-bold text-red-600">${result.stillNeeded.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Progress Complete</p>
                            <p className="text-2xl font-bold text-blue-600">{result.percentComplete.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Current Coverage</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {result.monthsOfExpensesCovered.toFixed(1)} months
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Time to Reach Goal</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {result.timeToGoal > 0 ? `${result.timeToGoal} months` : "Goal reached!"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Interest Earned</p>
                            <p className="text-2xl font-bold text-green-600">
                              ${result.projectedInterest?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Disclaimer:</strong> This calculator provides estimates for planning purposes only.
                            Consult a financial advisor for personalized advice.
                          </p>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                            <Share2 className="h-4 w-4" />
                            Share Results
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                            <Download className="h-4 w-4" />
                            Download Summary
                          </Button>
                        </div>
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Related Calculators */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Calculators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link href="/startup-cost-calculator" className="block p-2 hover:bg-gray-50 rounded">
                      <p className="font-medium">Startup Cost Calculator</p>
                      <p className="text-sm text-gray-600">Calculate business startup costs</p>
                    </Link>
                    <Link href="/tax-calculator" className="block p-2 hover:bg-gray-50 rounded">
                      <p className="font-medium">Tax Calculator</p>
                      <p className="text-sm text-gray-600">Calculate your taxes</p>
                    </Link>
                    <Link href="/loan-calculator" className="block p-2 hover:bg-gray-50 rounded">
                      <p className="font-medium">Loan Calculator</p>
                      <p className="text-sm text-gray-600">Calculate loan payments</p>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Fund Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <p>• Start with a small goal like $1,000</p>
                    <p>• Keep funds in a high-yield savings account</p>
                    <p>• Automate your savings contributions</p>
                    <p>• Only use for true emergencies</p>
                    <p>• Replenish immediately after use</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* SEO Content */}
          <div className="mt-12 prose max-w-none">
            <h2>How to Use the Emergency Fund Calculator</h2>
            <p>
              An emergency fund is a crucial financial safety net that can help you weather unexpected expenses like
              medical bills, car repairs, or job loss. Our emergency fund calculator helps you determine how much you
              should save and tracks your progress toward your goal.
            </p>

            <h3>Why You Need an Emergency Fund</h3>
            <ul>
              <li>Protects against unexpected expenses</li>
              <li>Prevents debt accumulation during emergencies</li>
              <li>Provides peace of mind and financial security</li>
              <li>Helps maintain your lifestyle during income disruptions</li>
            </ul>

            <h3>How Much Should You Save?</h3>
            <p>
              Financial experts typically recommend saving 3-6 months of living expenses. However, your ideal emergency
              fund size depends on factors like job stability, family size, and monthly expenses.
            </p>
          </div>
        </div>
      </div>
  )
}
