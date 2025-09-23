"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calculator, Share2, Download, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function BreakEvenCalculator() {
  const router = useRouter()
  const [fixedCosts, setFixedCosts] = useState("")
  const [variableCostPerUnit, setVariableCostPerUnit] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [salesMix, setSalesMix] = useState("single")
  const [seasonalityFactor, setSeasonalityFactor] = useState("0")
  const [targetProfit, setTargetProfit] = useState("20")
  const [result, setResult] = useState<any>(null)

  const calculateBreakEven = () => {
    const fixed = Number.parseFloat(fixedCosts) || 0
    const variableCost = Number.parseFloat(variableCostPerUnit) || 0
    const price = Number.parseFloat(pricePerUnit) || 0
    const seasonality = Number.parseFloat(seasonalityFactor) || 0
    const profitMargin = Number.parseFloat(targetProfit) || 0

    if (price <= variableCost) {
      setResult({ error: "Price per unit must be greater than variable cost per unit" })
      return
    }

    const contributionMargin = price - variableCost
    const breakEvenUnits = fixed / contributionMargin
    const breakEvenRevenue = breakEvenUnits * price
    const contributionMarginRatio = (contributionMargin / price) * 100

    // Calculate units needed for target profit
    const targetProfitAmount = fixed * (profitMargin / 100)
    const unitsForTargetProfit = (fixed + targetProfitAmount) / contributionMargin

    // Adjust for seasonality
    const seasonalBreakEven = breakEvenUnits * (1 + seasonality / 100)
    const seasonalTargetUnits = unitsForTargetProfit * (1 + seasonality / 100)

    setResult({
      breakEvenUnits: Math.ceil(breakEvenUnits),
      breakEvenRevenue,
      contributionMargin,
      contributionMarginRatio,
      unitsForTargetProfit: Math.ceil(unitsForTargetProfit),
      seasonalBreakEven: Math.ceil(seasonalBreakEven),
      seasonalTargetUnits: Math.ceil(seasonalTargetUnits),
      marginOfSafety: breakEvenUnits > 0 ? ((unitsForTargetProfit - breakEvenUnits) / unitsForTargetProfit) * 100 : 0,
    })
  }

  const getUnitLabel = () => {
    return salesMix === "service" ? "services" : "units"
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

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-blue-600" />
                    Break-Even Point Calculator
                  </CardTitle>
                  <CardDescription>Calculate how many {getUnitLabel()} you need to sell to break even</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fixedCosts">Fixed Costs per Month ($)</Label>
                      <Input
                          id="fixedCosts"
                          type="number"
                          placeholder="10000"
                          value={fixedCosts}
                          onChange={(e) => setFixedCosts(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Rent, salaries, insurance, etc.</p>
                    </div>
                    <div>
                      <Label htmlFor="variableCostPerUnit">
                        Variable Cost per {salesMix === "service" ? "Service" : "Unit"} ($)
                      </Label>
                      <Input
                          id="variableCostPerUnit"
                          type="number"
                          placeholder="25"
                          value={variableCostPerUnit}
                          onChange={(e) => setVariableCostPerUnit(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {salesMix === "service" ? "Direct costs per service" : "Materials, labor per unit"}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="pricePerUnit">Price per {salesMix === "service" ? "Service" : "Unit"} ($)</Label>
                      <Input
                          id="pricePerUnit"
                          type="number"
                          placeholder="50"
                          value={pricePerUnit}
                          onChange={(e) => setPricePerUnit(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {salesMix === "service" ? "Service fee charged" : "Selling price per unit"}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="salesMix">Business Type</Label>
                      <Select value={salesMix} onValueChange={setSalesMix}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single Product</SelectItem>
                          <SelectItem value="multiple">Multiple Products</SelectItem>
                          <SelectItem value="service">Service Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="seasonalityFactor">Seasonality Factor (%)</Label>
                      <Input
                          id="seasonalityFactor"
                          type="number"
                          placeholder="0"
                          value={seasonalityFactor}
                          onChange={(e) => setSeasonalityFactor(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Adjust for seasonal variations (+ for peak, - for low season)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="targetProfit">Target Profit Margin (%)</Label>
                      <Input
                          id="targetProfit"
                          type="number"
                          placeholder="20"
                          value={targetProfit}
                          onChange={(e) => setTargetProfit(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={calculateBreakEven} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Calculate Break-Even Point
                  </Button>

                  {result && (
                      <div className="calculator-result space-y-4">
                        {result.error ? (
                            <div className="text-red-600 font-semibold">{result.error}</div>
                        ) : (
                            <>
                              <h3 className="text-lg font-semibold text-blue-800">Your Break-Even Analysis</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Break-Even {getUnitLabel().charAt(0).toUpperCase() + getUnitLabel().slice(1)}
                                  </p>
                                  <p className="text-2xl font-bold text-green-600">
                                    {result.breakEvenUnits.toLocaleString()} {getUnitLabel()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Break-Even Revenue</p>
                                  <p className="text-2xl font-bold text-blue-600">
                                    ${result.breakEvenRevenue.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Contribution Margin</p>
                                  <p className="text-2xl font-bold text-purple-600">
                                    ${result.contributionMargin.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Contribution Margin %</p>
                                  <p className="text-2xl font-bold text-orange-600">
                                    {result.contributionMarginRatio.toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    {getUnitLabel().charAt(0).toUpperCase() + getUnitLabel().slice(1)} for Target Profit
                                  </p>
                                  <p className="text-2xl font-bold text-teal-600">
                                    {result.unitsForTargetProfit.toLocaleString()} {getUnitLabel()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Seasonal Break-Even {getUnitLabel().charAt(0).toUpperCase() + getUnitLabel().slice(1)}
                                  </p>
                                  <p className="text-2xl font-bold text-lime-600">
                                    {result.seasonalBreakEven.toLocaleString()} {getUnitLabel()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Seasonal {getUnitLabel().charAt(0).toUpperCase() + getUnitLabel().slice(1)} for Target
                                    Profit
                                  </p>
                                  <p className="text-2xl font-bold text-amber-600">
                                    {result.seasonalTargetUnits.toLocaleString()} {getUnitLabel()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Margin of Safety</p>
                                  <p className="text-2xl font-bold text-rose-600">
                                    {result.marginOfSafety ? result.marginOfSafety.toFixed(1) : 0}%
                                  </p>
                                </div>
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">What this means:</h4>
                                <p className="text-sm text-gray-700">
                                  You need to sell{" "}
                                  <strong>
                                    {result.breakEvenUnits.toLocaleString()} {getUnitLabel()}
                                  </strong>{" "}
                                  to cover all your costs. Each {salesMix === "service" ? "service" : "unit"} sold contributes{" "}
                                  <strong>${result.contributionMargin.toFixed(2)}</strong> toward covering your fixed costs.
                                </p>
                              </div>

                              <div className="flex gap-2 pt-4">
                                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                  <Share2 className="h-4 w-4" />
                                  Share Results
                                </Button>
                                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                  <Download className="h-4 w-4" />
                                  Download PDF
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
            <h2>Understanding Break-Even Analysis</h2>
            <p>
              Break-even analysis is a critical financial tool that helps business owners determine the minimum number of
              units they need to sell to cover all their costs. This calculation is essential for pricing decisions,
              business planning, and profitability analysis.
            </p>

            <h3>Key Components of Break-Even Analysis</h3>
            <ul>
              <li>
                <strong>Fixed Costs:</strong> Expenses that don't change with production volume (rent, salaries,
                insurance)
              </li>
              <li>
                <strong>Variable Costs:</strong> Costs that change with each unit produced (materials, direct labor)
              </li>
              <li>
                <strong>Contribution Margin:</strong> The amount each unit contributes to covering fixed costs
              </li>
            </ul>

            <h3>How to Use Break-Even Analysis</h3>
            <p>
              Use break-even analysis to make informed decisions about pricing, production levels, and business viability.
              It helps you understand the minimum sales volume needed to avoid losses and plan for profitability.
            </p>
          </div>
        </div>
      </div>
  )
}