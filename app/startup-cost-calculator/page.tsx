"use client"

import { useState } from "react"
import { Calculator, ArrowLeft, Share2, Download, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function StartupCostCalculator() {
  const [businessType, setBusinessType] = useState("")
  const [equipment, setEquipment] = useState("")
  const [inventory, setInventory] = useState("")
  const [marketing, setMarketing] = useState("")
  const [legal, setLegal] = useState("")
  const [rent, setRent] = useState("")
  const [utilities, setUtilities] = useState("")
  const [insurance, setInsurance] = useState("")
  const [other, setOther] = useState("")
  const [result, setResult] = useState<any>(null)

  const calculateStartupCosts = () => {
    const costs = {
      equipment: Number.parseFloat(equipment) || 0,
      inventory: Number.parseFloat(inventory) || 0,
      marketing: Number.parseFloat(marketing) || 0,
      legal: Number.parseFloat(legal) || 0,
      rent: Number.parseFloat(rent) || 0,
      utilities: Number.parseFloat(utilities) || 0,
      insurance: Number.parseFloat(insurance) || 0,
      other: Number.parseFloat(other) || 0,
    }

    const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0)
    const recommendedBuffer = totalCosts * 0.2 // 20% buffer
    const totalWithBuffer = totalCosts + recommendedBuffer

    setResult({
      costs,
      totalCosts,
      recommendedBuffer,
      totalWithBuffer,
      businessType,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <li className="text-gray-900">Startup Cost Calculator</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  Startup Cost Calculator
                </CardTitle>
                <CardDescription>Estimate the total cost to start your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail Store</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="service">Service Business</SelectItem>
                      <SelectItem value="online">Online Business</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipment">Equipment & Technology ($)</Label>
                    <Input
                      id="equipment"
                      type="number"
                      placeholder="15000"
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="inventory">Initial Inventory ($)</Label>
                    <Input
                      id="inventory"
                      type="number"
                      placeholder="10000"
                      value={inventory}
                      onChange={(e) => setInventory(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketing">Marketing & Advertising ($)</Label>
                    <Input
                      id="marketing"
                      type="number"
                      placeholder="5000"
                      value={marketing}
                      onChange={(e) => setMarketing(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="legal">Legal & Professional Fees ($)</Label>
                    <Input
                      id="legal"
                      type="number"
                      placeholder="3000"
                      value={legal}
                      onChange={(e) => setLegal(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rent">First 3 Months Rent ($)</Label>
                    <Input
                      id="rent"
                      type="number"
                      placeholder="9000"
                      value={rent}
                      onChange={(e) => setRent(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="utilities">Utilities Setup ($)</Label>
                    <Input
                      id="utilities"
                      type="number"
                      placeholder="1500"
                      value={utilities}
                      onChange={(e) => setUtilities(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance">Insurance (Annual) ($)</Label>
                    <Input
                      id="insurance"
                      type="number"
                      placeholder="2400"
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="other">Other Expenses ($)</Label>
                    <Input
                      id="other"
                      type="number"
                      placeholder="2000"
                      value={other}
                      onChange={(e) => setOther(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={calculateStartupCosts} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  Calculate Startup Costs
                </Button>

                {result && (
                  <div className="calculator-result space-y-4">
                    <h3 className="text-lg font-semibold text-blue-800">Your Startup Cost Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Startup Costs</p>
                        <p className="text-3xl font-bold text-green-600">${result.totalCosts.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Recommended Total (with 20% buffer)</p>
                        <p className="text-2xl font-bold text-blue-600">${result.totalWithBuffer.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Cost Breakdown:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>Equipment:</span>
                          <span>${result.costs.equipment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Inventory:</span>
                          <span>${result.costs.inventory.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Marketing:</span>
                          <span>${result.costs.marketing.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Legal Fees:</span>
                          <span>${result.costs.legal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rent:</span>
                          <span>${result.costs.rent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Utilities:</span>
                          <span>${result.costs.utilities.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Insurance:</span>
                          <span>${result.costs.insurance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Other:</span>
                          <span>${result.costs.other.toLocaleString()}</span>
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
                        Download Business Plan Template
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="ad-space">
              <p>Advertisement</p>
              <p className="text-sm">Business Funding Options</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get Funding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">Compare business loan options</p>
                <Button className="w-full bg-green-600 hover:bg-green-700">Find Business Loans</Button>
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
                    <p className="text-sm text-gray-600">When will you be profitable?</p>
                  </Link>
                  <Link href="/cash-flow-calculator" className="block p-2 hover:bg-gray-50 rounded">
                    <p className="font-medium">Cash Flow Calculator</p>
                    <p className="text-sm text-gray-600">Project your cash flow</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
