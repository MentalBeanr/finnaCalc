"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Share2, Download, TrendingUp, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CashFlowCalculator() {
  const router = useRouter()
  const [monthlyRevenue, setMonthlyRevenue] = useState("")
  const [monthlyExpenses, setMonthlyExpenses] = useState("")
  const [startingCash, setStartingCash] = useState("")
  const [growthRate, setGrowthRate] = useState("5")
  const [months, setMonths] = useState("12")
  const [result, setResult] = useState<any>(null)

  const calculateCashFlow = () => {
    const revenue = Number.parseFloat(monthlyRevenue) || 0
    const expenses = Number.parseFloat(monthlyExpenses) || 0
    const cash = Number.parseFloat(startingCash) || 0
    const growth = Number.parseFloat(growthRate) || 0
    const period = Number.parseInt(months) || 12

    const projections = []
    let currentCash = cash
    let currentRevenue = revenue

    for (let month = 1; month <= period; month++) {
      const monthlyNetCashFlow = currentRevenue - expenses
      currentCash += monthlyNetCashFlow

      projections.push({
        month,
        revenue: currentRevenue,
        expenses,
        netCashFlow: monthlyNetCashFlow,
        cumulativeCash: currentCash,
      })

      // Apply growth rate for next month
      currentRevenue = currentRevenue * (1 + growth / 100)
    }

    const totalRevenue = projections.reduce((sum, p) => sum + p.revenue, 0)
    const totalExpenses = projections.reduce((sum, p) => sum + p.expenses, 0)
    const finalCash = projections[projections.length - 1]?.cumulativeCash || 0

    setResult({
      projections,
      totalRevenue,
      totalExpenses,
      finalCash,
      netCashFlow: totalRevenue - totalExpenses,
    })
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    Cash Flow Projector
                  </CardTitle>
                  <CardDescription>Project your business cash flow over time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monthlyRevenue">Monthly Revenue ($)</Label>
                      <Input
                          id="monthlyRevenue"
                          type="number"
                          placeholder="25000"
                          value={monthlyRevenue}
                          onChange={(e) => setMonthlyRevenue(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthlyExpenses">Monthly Expenses ($)</Label>
                      <Input
                          id="monthlyExpenses"
                          type="number"
                          placeholder="20000"
                          value={monthlyExpenses}
                          onChange={(e) => setMonthlyExpenses(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="startingCash">Starting Cash Balance ($)</Label>
                      <Input
                          id="startingCash"
                          type="number"
                          placeholder="50000"
                          value={startingCash}
                          onChange={(e) => setStartingCash(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="growthRate">Monthly Growth Rate (%)</Label>
                      <Input
                          id="growthRate"
                          type="number"
                          step="0.1"
                          placeholder="5"
                          value={growthRate}
                          onChange={(e) => setGrowthRate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="months">Projection Period (months)</Label>
                      <Input
                          id="months"
                          type="number"
                          placeholder="12"
                          value={months}
                          onChange={(e) => setMonths(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={calculateCashFlow} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Calculate Cash Flow Projection
                  </Button>

                  {result && (
                      <div className="calculator-result space-y-4">
                        <h3 className="text-lg font-semibold text-blue-800">Your Cash Flow Projection</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Final Cash Balance</p>
                            <p
                                className={`text-2xl font-bold ${result.finalCash >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              ${result.finalCash.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-blue-600">${result.totalRevenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Net Cash Flow</p>
                            <p
                                className={`text-2xl font-bold ${result.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              ${result.netCashFlow.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                          <h4 className="font-semibold mb-3">Monthly Breakdown:</h4>
                          <div className="space-y-2 text-sm">
                            {result.projections.slice(0, 12).map((month: any) => (
                                <div key={month.month} className="flex justify-between items-center">
                                  <span>Month {month.month}:</span>
                                  <div className="text-right">
                                    <span className="text-gray-600">Rev: ${month.revenue.toLocaleString()}</span>
                                    <span className="ml-2 text-gray-600">Cash: ${month.cumulativeCash.toLocaleString()}</span>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                            <Share2 className="h-4 w-4" />
                            Share Results
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                            <Download className="h-4 w-4" />
                            Download Full Report
                          </Button>
                        </div>
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}