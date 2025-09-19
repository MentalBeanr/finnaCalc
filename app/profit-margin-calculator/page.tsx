"use client"

import { useState } from "react"
import { Calculator, ArrowLeft, Share2, Download, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function ProfitMarginCalculator() {
  const [revenue, setRevenue] = useState("")
  const [costOfGoodsSold, setCostOfGoodsSold] = useState("")
  const [operatingExpenses, setOperatingExpenses] = useState("")
  const [result, setResult] = useState<any>(null)

  const calculateProfitMargin = () => {
    const totalRevenue = Number.parseFloat(revenue) || 0
    const cogs = Number.parseFloat(costOfGoodsSold) || 0
    const opex = Number.parseFloat(operatingExpenses) || 0

    if (totalRevenue <= 0) {
      setResult({ error: "Revenue must be greater than 0" })
      return
    }

    const grossProfit = totalRevenue - cogs
    const netProfit = grossProfit - opex

    const grossMargin = (grossProfit / totalRevenue) * 100
    const netMargin = (netProfit / totalRevenue) * 100
    const operatingMargin = ((totalRevenue - cogs - opex) / totalRevenue) * 100

    setResult({
      totalRevenue,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      operatingMargin,
      cogs,
      opex,
    })
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
              <li className="text-gray-900">Profit Margin Calculator</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    Profit Margin Calculator
                  </CardTitle>
                  <CardDescription>Calculate gross, net, and operating profit margins for your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="revenue">Total Revenue ($)</Label>
                      <Input
                          id="revenue"
                          type="number"
                          placeholder="100000"
                          value={revenue}
                          onChange={(e) => setRevenue(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Total sales revenue</p>
                    </div>
                    <div>
                      <Label htmlFor="costOfGoodsSold">Cost of Goods Sold ($)</Label>
                      <Input
                          id="costOfGoodsSold"
                          type="number"
                          placeholder="60000"
                          value={costOfGoodsSold}
                          onChange={(e) => setCostOfGoodsSold(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Direct costs to produce goods/services</p>
                    </div>
                    <div>
                      <Label htmlFor="operatingExpenses">Operating Expenses ($)</Label>
                      <Input
                          id="operatingExpenses"
                          type="number"
                          placeholder="25000"
                          value={operatingExpenses}
                          onChange={(e) => setOperatingExpenses(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Rent, salaries, marketing, etc.</p>
                    </div>
                  </div>

                  <Button onClick={calculateProfitMargin} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Calculate Profit Margins
                  </Button>

                  {result && (
                      <div className="calculator-result space-y-4">
                        {result.error ? (
                            <div className="text-red-600 font-semibold">{result.error}</div>
                        ) : (
                            <>
                              <h3 className="text-lg font-semibold text-blue-800">Your Profit Margin Analysis</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Gross Profit Margin</p>
                                  <p className="text-2xl font-bold text-green-600">{result.grossMargin.toFixed(2)}%</p>
                                  <p className="text-sm text-gray-500">${result.grossProfit.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Operating Profit Margin</p>
                                  <p className="text-2xl font-bold text-blue-600">{result.operatingMargin.toFixed(2)}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Net Profit Margin</p>
                                  <p
                                      className={`text-2xl font-bold ${result.netMargin >= 0 ? "text-purple-600" : "text-red-600"}`}
                                  >
                                    {result.netMargin.toFixed(2)}%
                                  </p>
                                  <p className="text-sm text-gray-500">${result.netProfit.toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3">Profit Breakdown:</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Total Revenue:</span>
                                    <span className="font-semibold">${result.totalRevenue.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>- Cost of Goods Sold:</span>
                                    <span className="text-red-600">-${result.cogs.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span>= Gross Profit:</span>
                                    <span className="font-semibold text-green-600">
                                ${result.grossProfit.toLocaleString()}
                              </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>- Operating Expenses:</span>
                                    <span className="text-red-600">-${result.opex.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span>= Net Profit:</span>
                                    <span
                                        className={`font-semibold ${result.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                ${result.netProfit.toLocaleString()}
                              </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2 text-blue-800">Industry Benchmarks:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium">Retail</p>
                                    <p className="text-gray-600">Gross: 20-50%</p>
                                    <p className="text-gray-600">Net: 2-6%</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Software</p>
                                    <p className="text-gray-600">Gross: 70-90%</p>
                                    <p className="text-gray-600">Net: 15-25%</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Restaurants</p>
                                    <p className="text-gray-600">Gross: 60-70%</p>
                                    <p className="text-gray-600">Net: 3-7%</p>
                                  </div>
                                </div>
                              </div>

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
                <p className="text-sm">Accounting Software for Small Business</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Improve Your Margins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-semibold">Reduce COGS</h4>
                      <p className="text-gray-600">Negotiate better supplier rates, improve efficiency</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Optimize Pricing</h4>
                      <p className="text-gray-600">Test price increases, add premium options</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Cut Operating Costs</h4>
                      <p className="text-gray-600">Automate processes, reduce overhead</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Calculators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link href="/break-even-calculator" className="block p-2 hover:bg-gray-50 rounded">
                      <p className="font-medium">Break-Even Calculator</p>
                      <p className="text-sm text-gray-600">Find break-even point</p>
                    </Link>
                    <Link href="/pricing-calculator" className="block p-2 hover:bg-gray-50 rounded">
                      <p className="font-medium">Pricing Calculator</p>
                      <p className="text-sm text-gray-600">Set optimal prices</p>
                    </Link>
                    <Link href="/cash-flow-calculator" className="block p-2 hover:bg-gray-50 rounded">
                      <p className="font-medium">Cash Flow Calculator</p>
                      <p className="text-sm text-gray-600">Project cash flow</p>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* SEO Content */}
          <div className="mt-12 prose max-w-none">
            <h2>Understanding Profit Margins</h2>
            <p>
              Profit margins are essential metrics that show how much profit your business generates from its revenue.
              They help you understand your business's financial health, compare performance against competitors, and make
              informed pricing and cost decisions.
            </p>

            <h3>Types of Profit Margins</h3>
            <ul>
              <li>
                <strong>Gross Profit Margin:</strong> Shows profitability after direct costs
              </li>
              <li>
                <strong>Operating Profit Margin:</strong> Includes operating expenses
              </li>
              <li>
                <strong>Net Profit Margin:</strong> The bottom line after all expenses
              </li>
            </ul>

            <h3>How to Improve Profit Margins</h3>
            <p>
              Improving profit margins requires a strategic approach focusing on increasing revenue, reducing costs, or
              both. Consider optimizing pricing, negotiating better supplier terms, improving operational efficiency, and
              focusing on higher-margin products or services.
            </p>
          </div>
        </div>
      </div>
  )
}
