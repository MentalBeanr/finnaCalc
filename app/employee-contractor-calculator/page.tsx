"use client"

import { useState } from "react"
import { Calculator, ArrowLeft, Share2, Download, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function EmployeeContractorCalculator() {
  const [salary, setSalary] = useState("")
  const [contractorRate, setContractorRate] = useState("")
  const [hoursPerWeek, setHoursPerWeek] = useState("40")
  const [weeksPerYear, setWeeksPerYear] = useState("50")
  const [result, setResult] = useState<any>(null)

  const calculateComparison = () => {
    const annualSalary = Number.parseFloat(salary) || 0
    const hourlyRate = Number.parseFloat(contractorRate) || 0
    const hours = Number.parseFloat(hoursPerWeek) || 40
    const weeks = Number.parseFloat(weeksPerYear) || 50

    // Employee costs
    const employeeBenefits = annualSalary * 0.25 // 25% for benefits
    const payrollTaxes = annualSalary * 0.0765 // 7.65% employer portion
    const workersComp = annualSalary * 0.02 // 2% workers comp
    const unemployment = Math.min(annualSalary * 0.006, 420) // FUTA tax
    const totalEmployeeCost = annualSalary + employeeBenefits + payrollTaxes + workersComp + unemployment

    // Contractor costs
    const contractorAnnualCost = hourlyRate * hours * weeks
    const contractorHourlyEquivalent = totalEmployeeCost / (hours * weeks)

    // Savings calculation
    const savings = totalEmployeeCost - contractorAnnualCost
    const savingsPercentage = (savings / totalEmployeeCost) * 100

    setResult({
      employee: {
        salary: annualSalary,
        benefits: employeeBenefits,
        payrollTaxes,
        workersComp,
        unemployment,
        totalCost: totalEmployeeCost,
      },
      contractor: {
        hourlyRate,
        annualCost: contractorAnnualCost,
        equivalentHourlyRate: contractorHourlyEquivalent,
      },
      comparison: {
        savings,
        savingsPercentage,
        recommendation: savings > 0 ? "contractor" : "employee",
      },
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
              <li className="text-gray-900">Employee vs Contractor Calculator</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    Employee vs Contractor Calculator
                  </CardTitle>
                  <CardDescription>Compare the total costs of hiring employees vs contractors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary">Employee Annual Salary ($)</Label>
                      <Input
                          id="salary"
                          type="number"
                          placeholder="60000"
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contractorRate">Contractor Hourly Rate ($)</Label>
                      <Input
                          id="contractorRate"
                          type="number"
                          placeholder="40"
                          value={contractorRate}
                          onChange={(e) => setContractorRate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hoursPerWeek">Hours per Week</Label>
                      <Input
                          id="hoursPerWeek"
                          type="number"
                          placeholder="40"
                          value={hoursPerWeek}
                          onChange={(e) => setHoursPerWeek(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weeksPerYear">Weeks per Year</Label>
                      <Input
                          id="weeksPerYear"
                          type="number"
                          placeholder="50"
                          value={weeksPerYear}
                          onChange={(e) => setWeeksPerYear(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={calculateComparison} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Compare Costs
                  </Button>

                  {result && (
                      <div className="calculator-result space-y-4">
                        <h3 className="text-lg font-semibold text-blue-800">Cost Comparison Analysis</h3>

                        <Tabs defaultValue="comparison" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="comparison">Comparison</TabsTrigger>
                            <TabsTrigger value="employee">Employee</TabsTrigger>
                            <TabsTrigger value="contractor">Contractor</TabsTrigger>
                          </TabsList>

                          <TabsContent value="comparison" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Total Employee Cost</p>
                                <p className="text-2xl font-bold text-red-600">
                                  ${result.employee.totalCost.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Total Contractor Cost</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  ${result.contractor.annualCost.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Annual Savings</p>
                                <p
                                    className={`text-2xl font-bold ${result.comparison.savings >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  ${Math.abs(result.comparison.savings).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Savings Percentage</p>
                                <p
                                    className={`text-2xl font-bold ${result.comparison.savingsPercentage >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {Math.abs(result.comparison.savingsPercentage).toFixed(1)}%
                                </p>
                              </div>
                            </div>

                            <div
                                className={`p-4 rounded-lg ${result.comparison.recommendation === "contractor" ? "bg-green-50" : "bg-blue-50"}`}
                            >
                              <h4 className="font-semibold mb-2">Recommendation:</h4>
                              <p className="text-sm">
                                {result.comparison.recommendation === "contractor"
                                    ? `Hiring a contractor could save you $${result.comparison.savings.toLocaleString()} annually (${result.comparison.savingsPercentage.toFixed(1)}% savings).`
                                    : `Hiring an employee might be more cost-effective despite higher upfront costs, providing better long-term value and control.`}
                              </p>
                            </div>
                          </TabsContent>

                          <TabsContent value="employee" className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-3">Employee Cost Breakdown:</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Base Salary:</span>
                                  <span>${result.employee.salary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Benefits (25%):</span>
                                  <span>${result.employee.benefits.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Payroll Taxes:</span>
                                  <span>${result.employee.payrollTaxes.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Workers Comp:</span>
                                  <span>${result.employee.workersComp.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Unemployment:</span>
                                  <span>${result.employee.unemployment.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 font-semibold">
                                  <span>Total Cost:</span>
                                  <span>${result.employee.totalCost.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="contractor" className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-3">Contractor Cost Analysis:</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Hourly Rate:</span>
                                  <span>${result.contractor.hourlyRate}/hour</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Annual Cost:</span>
                                  <span>${result.contractor.annualCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Equivalent Employee Rate:</span>
                                  <span>${result.contractor.equivalentHourlyRate.toFixed(2)}/hour</span>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" className="flex items-center gap-2">
                            <Share2 className="h-4 w-4" />
                            Share Results
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Download Analysis
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
                <p className="text-sm">HR & Payroll Services</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">HR Solutions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Simplify payroll and HR management</p>
                  <Button className="w-full bg-green-600 hover:bg-green-700">Get HR Software</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}
