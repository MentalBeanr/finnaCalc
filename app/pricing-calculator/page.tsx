"use client"

import { useState } from "react"
import { Calculator, ArrowLeft, Share2, Download, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function PricingCalculator() {
  const [hourlyRate, setHourlyRate] = useState("")
  const [hoursPerWeek, setHoursPerWeek] = useState("")
  const [weeksPerYear, setWeeksPerYear] = useState("50")
  const [expenses, setExpenses] = useState("")
  const [profitMargin, setProfitMargin] = useState("20")

  const [productCost, setProductCost] = useState("")
  const [productMargin, setProductMargin] = useState("50")

  const [result, setResult] = useState<any>(null)

  const calculateServicePricing = () => {
    const rate = Number.parseFloat(hourlyRate) || 0
    const hours = Number.parseFloat(hoursPerWeek) || 0
    const weeks = Number.parseFloat(weeksPerYear) || 50
    const annualExpenses = Number.parseFloat(expenses) || 0
    const margin = Number.parseFloat(profitMargin) || 20

    const annualRevenue = rate * hours * weeks
    const netIncome = annualRevenue - annualExpenses
    const requiredRevenue = annualExpenses / (1 - margin / 100)
    const requiredHourlyRate = requiredRevenue / (hours * weeks)

    setResult({
      type: "service",
      annualRevenue,
      netIncome,
      requiredHourlyRate,
      currentRate: rate,
      totalHours: hours * weeks,
    })
  }

  const calculateProductPricing = () => {
    const cost = Number.parseFloat(productCost) || 0
    const margin = Number.parseFloat(productMargin) || 50

    const sellingPrice = cost / (1 - margin / 100)
    const profit = sellingPrice - cost
    const markupPercentage = (profit / cost) * 100

    setResult({
      type: "product",
      cost,
      sellingPrice,
      profit,
      markupPercentage,
      marginPercentage: margin,
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
            <li className="text-gray-900">Pricing Calculator</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                  Pricing Calculator
                </CardTitle>
                <CardDescription>Calculate optimal pricing for your services and products</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="service" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="service">Service Pricing</TabsTrigger>
                    <TabsTrigger value="product">Product Pricing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="service" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hourlyRate">Current Hourly Rate ($)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          placeholder="75"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hoursPerWeek">Billable Hours per Week</Label>
                        <Input
                          id="hoursPerWeek"
                          type="number"
                          placeholder="30"
                          value={hoursPerWeek}
                          onChange={(e) => setHoursPerWeek(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="weeksPerYear">Working Weeks per Year</Label>
                        <Input
                          id="weeksPerYear"
                          type="number"
                          placeholder="50"
                          value={weeksPerYear}
                          onChange={(e) => setWeeksPerYear(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expenses">Annual Business Expenses ($)</Label>
                        <Input
                          id="expenses"
                          type="number"
                          placeholder="25000"
                          value={expenses}
                          onChange={(e) => setExpenses(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="profitMargin">Desired Profit Margin (%)</Label>
                        <Input
                          id="profitMargin"
                          type="number"
                          placeholder="20"
                          value={profitMargin}
                          onChange={(e) => setProfitMargin(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={calculateServicePricing}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      Calculate Service Pricing
                    </Button>
                  </TabsContent>

                  <TabsContent value="product" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="productCost">Product Cost ($)</Label>
                        <Input
                          id="productCost"
                          type="number"
                          placeholder="25"
                          value={productCost}
                          onChange={(e) => setProductCost(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Total cost to make/acquire</p>
                      </div>
                      <div>
                        <Label htmlFor="productMargin">Desired Profit Margin (%)</Label>
                        <Input
                          id="productMargin"
                          type="number"
                          placeholder="50"
                          value={productMargin}
                          onChange={(e) => setProductMargin(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Percentage of selling price</p>
                      </div>
                    </div>

                    <Button
                      onClick={calculateProductPricing}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      Calculate Product Pricing
                    </Button>
                  </TabsContent>
                </Tabs>

                {result && (
                  <div className="calculator-result space-y-4 mt-6">
                    <h3 className="text-lg font-semibold text-blue-800">
                      Your {result.type === "service" ? "Service" : "Product"} Pricing Analysis
                    </h3>

                    {result.type === "service" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Annual Revenue (Current Rate)</p>
                          <p className="text-2xl font-bold text-green-600">${result.annualRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Net Income</p>
                          <p
                            className={`text-2xl font-bold ${result.netIncome >= 0 ? "text-blue-600" : "text-red-600"}`}
                          >
                            ${result.netIncome.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Recommended Hourly Rate</p>
                          <p className="text-2xl font-bold text-purple-600">${result.requiredHourlyRate.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Billable Hours</p>
                          <p className="text-2xl font-bold text-orange-600">{result.totalHours.toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Recommended Selling Price</p>
                          <p className="text-2xl font-bold text-green-600">${result.sellingPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Profit per Unit</p>
                          <p className="text-2xl font-bold text-blue-600">${result.profit.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Markup Percentage</p>
                          <p className="text-2xl font-bold text-purple-600">{result.markupPercentage.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Profit Margin</p>
                          <p className="text-2xl font-bold text-orange-600">{result.marginPercentage}%</p>
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
                        Download Pricing Guide
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="ad-space">
              <p>Advertisement</p>
              <p className="text-sm">Business Tools & Software</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold">Research Competitors</h4>
                    <p className="text-gray-600">Know what others charge for similar services</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Value-Based Pricing</h4>
                    <p className="text-gray-600">Price based on value delivered, not just costs</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Test and Adjust</h4>
                    <p className="text-gray-600">Start with calculated price and adjust based on market response</p>
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
                  <Link href="/profit-margin-calculator" className="block p-2 hover:bg-gray-50 rounded">
                    <p className="font-medium">Profit Margin Calculator</p>
                    <p className="text-sm text-gray-600">Calculate profit margins</p>
                  </Link>
                  <Link href="/break-even-calculator" className="block p-2 hover:bg-gray-50 rounded">
                    <p className="font-medium">Break-Even Calculator</p>
                    <p className="text-sm text-gray-600">Find break-even point</p>
                  </Link>
                  <Link href="/freelance-rate-calculator" className="block p-2 hover:bg-gray-50 rounded">
                    <p className="font-medium">Freelance Rate Calculator</p>
                    <p className="text-sm text-gray-600">Set freelance rates</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SEO Content */}
        <div className="mt-12 prose max-w-none">
          <h2>How to Price Your Services and Products</h2>
          <p>
            Pricing is one of the most critical decisions for any business. Set prices too low, and you'll struggle to
            cover costs and make a profit. Set them too high, and you may lose customers to competitors. Our pricing
            calculator helps you find the sweet spot.
          </p>

          <h3>Service Pricing Strategies</h3>
          <ul>
            <li>
              <strong>Cost-Plus Pricing:</strong> Add a markup to your costs
            </li>
            <li>
              <strong>Value-Based Pricing:</strong> Price based on value delivered to clients
            </li>
            <li>
              <strong>Competitive Pricing:</strong> Price relative to competitors
            </li>
            <li>
              <strong>Hourly vs Project Pricing:</strong> Choose the model that works best
            </li>
          </ul>

          <h3>Product Pricing Considerations</h3>
          <p>
            When pricing products, consider manufacturing costs, overhead, desired profit margins, competitor pricing,
            and perceived value. Remember that pricing affects both profitability and market positioning.
          </p>
        </div>
      </div>
    </div>
  )
}
