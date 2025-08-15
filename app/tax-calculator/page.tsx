"use client"

import { useState } from "react"
import { Calculator, ArrowLeft, Share2, Download, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function TaxCalculator() {
  const [businessIncome, setBusinessIncome] = useState("")
  const [businessExpenses, setBusinessExpenses] = useState("")
  const [homeOffice, setHomeOffice] = useState("")
  const [vehicleExpenses, setVehicleExpenses] = useState("")
  const [equipment, setEquipment] = useState("")
  const [filingStatus, setFilingStatus] = useState("single")
  const [result, setResult] = useState<any>(null)

  const calculateTaxSavings = () => {
    const income = Number.parseFloat(businessIncome) || 0
    const expenses = Number.parseFloat(businessExpenses) || 0
    const homeOfficeDeduction = Number.parseFloat(homeOffice) || 0
    const vehicleDeduction = Number.parseFloat(vehicleExpenses) || 0
    const equipmentDeduction = Number.parseFloat(equipment) || 0

    const totalDeductions = expenses + homeOfficeDeduction + vehicleDeduction + equipmentDeduction
    const taxableIncome = Math.max(0, income - totalDeductions)

    // Simplified tax calculation (2024 rates)
    const selfEmploymentTax = income * 0.1413 // 14.13% SE tax
    const federalTaxRate = income > 100000 ? 0.24 : income > 50000 ? 0.22 : 0.12
    const federalTax = taxableIncome * federalTaxRate

    const totalTaxWithoutDeductions = income * federalTaxRate + selfEmploymentTax
    const totalTaxWithDeductions = federalTax + income * 0.1413
    const taxSavings = totalTaxWithoutDeductions - totalTaxWithDeductions

    setResult({
      income,
      totalDeductions,
      taxableIncome,
      federalTax,
      selfEmploymentTax,
      totalTax: totalTaxWithDeductions,
      taxSavings,
      effectiveTaxRate: (totalTaxWithDeductions / income) * 100,
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
            <li className="text-gray-900">Tax Savings Calculator</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-blue-600" />
                  Tax Savings Calculator
                </CardTitle>
                <CardDescription>Estimate your potential tax savings with business deductions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="filingStatus">Filing Status</Label>
                  <Select value={filingStatus} onValueChange={setFilingStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select filing status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married Filing Jointly</SelectItem>
                      <SelectItem value="head">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessIncome">Annual Business Income ($)</Label>
                    <Input
                      id="businessIncome"
                      type="number"
                      placeholder="75000"
                      value={businessIncome}
                      onChange={(e) => setBusinessIncome(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessExpenses">Business Expenses ($)</Label>
                    <Input
                      id="businessExpenses"
                      type="number"
                      placeholder="15000"
                      value={businessExpenses}
                      onChange={(e) => setBusinessExpenses(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="homeOffice">Home Office Deduction ($)</Label>
                    <Input
                      id="homeOffice"
                      type="number"
                      placeholder="3000"
                      value={homeOffice}
                      onChange={(e) => setHomeOffice(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleExpenses">Vehicle/Travel Expenses ($)</Label>
                    <Input
                      id="vehicleExpenses"
                      type="number"
                      placeholder="5000"
                      value={vehicleExpenses}
                      onChange={(e) => setVehicleExpenses(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipment">Equipment/Depreciation ($)</Label>
                    <Input
                      id="equipment"
                      type="number"
                      placeholder="8000"
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={calculateTaxSavings} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  Calculate Tax Savings
                </Button>

                {result && (
                  <div className="calculator-result space-y-4">
                    <h3 className="text-lg font-semibold text-blue-800">Your Tax Savings Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Estimated Tax Savings</p>
                        <p className="text-3xl font-bold text-green-600">${result.taxSavings.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Deductions</p>
                        <p className="text-2xl font-bold text-blue-600">${result.totalDeductions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Effective Tax Rate</p>
                        <p className="text-2xl font-bold text-purple-600">{result.effectiveTaxRate.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Tax Breakdown:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Business Income:</span>
                          <span>${result.income.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Deductions:</span>
                          <span className="text-green-600">-${result.totalDeductions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Taxable Income:</span>
                          <span className="font-semibold">${result.taxableIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Federal Tax:</span>
                          <span>${result.federalTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Self-Employment Tax:</span>
                          <span>${result.selfEmploymentTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                          <span>Total Tax:</span>
                          <span>${result.totalTax.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Disclaimer:</strong> This is an estimate for planning purposes only. Consult a tax
                        professional for accurate tax advice.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Share Results
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download Tax Report
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
              <p className="text-sm">Tax Software & Services</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get Tax Help</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">Connect with tax professionals</p>
                <Button className="w-full bg-green-600 hover:bg-green-700">Find Tax Experts</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
