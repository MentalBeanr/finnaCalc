"use client"

import { useState } from "react"
import { Share2, Download, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function ROICalculator() {
  const [initialInvestment, setInitialInvestment] = useState("")
  const [finalValue, setFinalValue] = useState("")
  const [timeHorizon, setTimeHorizon] = useState("")
  const [calculationType, setCalculationType] = useState("simple")
  const [investmentType, setInvestmentType] = useState("stocks")
  const [dividendYield, setDividendYield] = useState("0")
  const [inflationRate, setInflationRate] = useState("3.0")
  const [taxRate, setTaxRate] = useState("20")
  const [result, setResult] = useState<any>(null)

  const calculateROI = () => {
    const initial = Number.parseFloat(initialInvestment) || 0
    const final = Number.parseFloat(finalValue) || 0
    const time = Number.parseFloat(timeHorizon) || 1
    const dividend = Number.parseFloat(dividendYield) || 0
    const inflation = Number.parseFloat(inflationRate) || 0
    const tax = Number.parseFloat(taxRate) || 0

    if (initial <= 0) {
      setResult({ error: "Initial investment must be greater than 0" })
      return
    }

    const totalReturn = final - initial
    const roiPercentage = (totalReturn / initial) * 100
    const annualizedROI =
        calculationType === "annualized" && time > 0
            ? (Math.pow(final / initial, 1 / time) - 1) * 100
            : roiPercentage / time

    // Calculate dividend income
    const annualDividendIncome = initial * (dividend / 100)
    const totalDividendIncome = annualDividendIncome * time

    // Calculate after-tax returns
    const capitalGainsTax = totalReturn > 0 ? totalReturn * (tax / 100) : 0
    const dividendTax = totalDividendIncome * (tax / 100)
    const afterTaxReturn = totalReturn + totalDividendIncome - capitalGainsTax - dividendTax

    // Calculate real (inflation-adjusted) return
    const realROI = annualizedROI - inflation
    const realValue = initial * Math.pow(1 + realROI / 100, time)

    setResult({
      totalReturn,
      roiPercentage,
      annualizedROI,
      initial,
      final,
      time,
      dividendIncome: totalDividendIncome,
      afterTaxReturn,
      realROI,
      realValue,
      totalTaxes: capitalGainsTax + dividendTax,
    })
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900">ROI Calculator</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-8">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    Return on Investment (ROI) Calculator
                  </CardTitle>
                  <CardDescription>Calculate the return on your investments and business projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="calculationType">Calculation Type</Label>
                      <Select value={calculationType} onValueChange={setCalculationType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select calculation type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple ROI</SelectItem>
                          <SelectItem value="annualized">Annualized ROI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
                      <Input
                          id="initialInvestment"
                          type="number"
                          placeholder="10000"
                          value={initialInvestment}
                          onChange={(e) => setInitialInvestment(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="finalValue">Final Value ($)</Label>
                      <Input
                          id="finalValue"
                          type="number"
                          placeholder="15000"
                          value={finalValue}
                          onChange={(e) => setFinalValue(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeHorizon">Time Period (years)</Label>
                      <Input
                          id="timeHorizon"
                          type="number"
                          step="0.1"
                          placeholder="2"
                          value={timeHorizon}
                          onChange={(e) => setTimeHorizon(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="investmentType">Investment Type</Label>
                      <Select value={investmentType} onValueChange={setInvestmentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select investment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stocks">Stocks</SelectItem>
                          <SelectItem value="realestate">Real Estate</SelectItem>
                          <SelectItem value="business">Business Investment</SelectItem>
                          <SelectItem value="bonds">Bonds</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dividendYield">Annual Dividend/Income Yield (%)</Label>
                      <Input
                          id="dividendYield"
                          type="number"
                          step="0.01"
                          placeholder="3.5"
                          value={dividendYield}
                          onChange={(e) => setDividendYield(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="inflationRate">Expected Inflation Rate (%)</Label>
                      <Input
                          id="inflationRate"
                          type="number"
                          step="0.01"
                          placeholder="3.0"
                          value={inflationRate}
                          onChange={(e) => setInflationRate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxRate">Tax Rate on Gains (%)</Label>
                      <Input
                          id="taxRate"
                          type="number"
                          step="0.01"
                          placeholder="20"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={calculateROI} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Calculate ROI
                  </Button>

                  {result && (
                      <div className="calculator-result space-y-4">
                        {result.error ? (
                            <div className="text-red-600 font-semibold">{result.error}</div>
                        ) : (
                            <>
                              <h3 className="text-lg font-semibold text-blue-800">Your ROI Analysis</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Total Return</p>
                                  <p
                                      className={`text-2xl font-bold ${result.totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    ${result.totalReturn.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">ROI Percentage</p>
                                  <p
                                      className={`text-2xl font-bold ${result.roiPercentage >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {result.roiPercentage.toFixed(2)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Annualized ROI</p>
                                  <p
                                      className={`text-2xl font-bold ${result.annualizedROI >= 0 ? "text-blue-600" : "text-red-600"}`}
                                  >
                                    {result.annualizedROI.toFixed(2)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Investment Period</p>
                                  <p className="text-2xl font-bold text-purple-600">{result.time} years</p>
                                </div>
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Investment Summary:</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Initial Investment:</p>
                                    <p className="font-semibold">${result.initial.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Final Value:</p>
                                    <p className="font-semibold">${result.final.toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <p className="text-sm text-gray-700">
                                    {result.totalReturn >= 0
                                        ? `Your investment gained $${result.totalReturn.toLocaleString()} over ${result.time} years.`
                                        : `Your investment lost $${Math.abs(result.totalReturn).toLocaleString()} over ${result.time} years.`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-4">
                                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                  <Share2 className="h-4 w-4" />
                                  Share Results
                                </Button>
                                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
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
          </div>

          {/* SEO Content */}
          <div className="mt-12 prose max-w-none">
            <h2>Understanding Return on Investment (ROI)</h2>
            <p>
              Return on Investment (ROI) is a fundamental financial metric used to evaluate the efficiency and
              profitability of an investment. It measures the amount of return on an investment relative to the
              investment's cost, helping investors make informed decisions about where to allocate their capital.
            </p>

            <h3>ROI Formula and Calculation</h3>
            <p>
              The basic ROI formula is:{" "}
              <strong>ROI = (Final Value - Initial Investment) / Initial Investment × 100</strong>
            </p>
            <p>
              For investments held over multiple years, annualized ROI provides a more accurate comparison by accounting
              for the time factor in your returns.
            </p>

            <h3>What Makes a Good ROI?</h3>
            <ul>
              <li>
                <strong>Stock Market:</strong> Historical average of 7-10% annually
              </li>
              <li>
                <strong>Real Estate:</strong> Typically 8-12% annually
              </li>
              <li>
                <strong>Business Investments:</strong> Often target 15-25% or higher
              </li>
              <li>
                <strong>Bonds:</strong> Generally 2-6% annually
              </li>
            </ul>

            <h3>Factors to Consider</h3>
            <p>
              While ROI is a valuable metric, consider other factors like risk level, liquidity, time horizon, and
              opportunity cost when making investment decisions. Higher ROI often comes with higher risk.
            </p>
          </div>
        </div>
      </div>
  )
}
