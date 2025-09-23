"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Share2, Download, Receipt, Calculator, Users, Building2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

export default function TaxCalculator() {
  const router = useRouter()
  const [taxType, setTaxType] = useState("individual")
  const [filingStatus, setFilingStatus] = useState("single")
  const [income, setIncome] = useState("")
  const [businessIncome, setBusinessIncome] = useState("")
  const [businessExpenses, setBusinessExpenses] = useState("")
  const [homeOffice, setHomeOffice] = useState("")
  const [vehicleExpenses, setVehicleExpenses] = useState("")
  const [equipment, setEquipment] = useState("")
  const [mortgageInterest, setMortgageInterest] = useState("")
  const [charitableDonations, setCharitableDonations] = useState("")
  const [stateLocalTax, setStateLocalTax] = useState("")
  const [medicalExpenses, setMedicalExpenses] = useState("")
  const [studentLoanInterest, setStudentLoanInterest] = useState("")
  const [childTaxCredit, setChildTaxCredit] = useState(false)
  const [earnedIncomeCredit, setEarnedIncomeCredit] = useState(false)
  const [dependents, setDependents] = useState("")
  const [result, setResult] = useState<any>(null)

  const calculateTax = () => {
    if (taxType === "individual") {
      calculateIndividualTax()
    } else {
      calculateBusinessTax()
    }
  }

  const calculateIndividualTax = () => {
    const grossIncome = Number.parseFloat(income) || 0
    const mortgage = Number.parseFloat(mortgageInterest) || 0
    const charitable = Number.parseFloat(charitableDonations) || 0
    const saltDeduction = Math.min(Number.parseFloat(stateLocalTax) || 0, 10000) // SALT cap
    const medical = Math.max(0, (Number.parseFloat(medicalExpenses) || 0) - grossIncome * 0.075) // 7.5% AGI threshold
    const studentLoan = Math.min(Number.parseFloat(studentLoanInterest) || 0, 2500) // Student loan cap
    const numDependents = Number.parseFloat(dependents) || 0

    // Standard deduction for 2024
    const standardDeduction = filingStatus === "married" ? 29200 : filingStatus === "head" ? 21900 : 14600
    const itemizedDeductions = mortgage + charitable + saltDeduction + medical
    const totalDeductions = Math.max(standardDeduction, itemizedDeductions)

    const adjustedGrossIncome = grossIncome - studentLoan
    const taxableIncome = Math.max(0, adjustedGrossIncome - totalDeductions)

    // 2024 tax brackets
    let federalTax = 0
    if (filingStatus === "single") {
      if (taxableIncome > 609350) federalTax += (taxableIncome - 609350) * 0.37
      if (taxableIncome > 243725) federalTax += Math.min(taxableIncome - 243725, 609350 - 243725) * 0.35
      if (taxableIncome > 191950) federalTax += Math.min(taxableIncome - 191950, 243725 - 191950) * 0.32
      if (taxableIncome > 100525) federalTax += Math.min(taxableIncome - 100525, 191950 - 100525) * 0.24
      if (taxableIncome > 47150) federalTax += Math.min(taxableIncome - 47150, 100525 - 47150) * 0.22
      if (taxableIncome > 11000) federalTax += Math.min(taxableIncome - 11000, 47150 - 11000) * 0.12
      if (taxableIncome > 0) federalTax += Math.min(taxableIncome, 11000) * 0.1
    } else if (filingStatus === "married") {
      if (taxableIncome > 731200) federalTax += (taxableIncome - 731200) * 0.37
      if (taxableIncome > 487450) federalTax += Math.min(taxableIncome - 487450, 731200 - 487450) * 0.35
      if (taxableIncome > 383900) federalTax += Math.min(taxableIncome - 383900, 487450 - 383900) * 0.32
      if (taxableIncome > 201050) federalTax += Math.min(taxableIncome - 201050, 383900 - 201050) * 0.24
      if (taxableIncome > 94300) federalTax += Math.min(taxableIncome - 94300, 201050 - 94300) * 0.22
      if (taxableIncome > 22000) federalTax += Math.min(taxableIncome - 22000, 94300 - 22000) * 0.12
      if (taxableIncome > 0) federalTax += Math.min(taxableIncome, 22000) * 0.1
    }

    // Tax credits
    let taxCredits = 0
    if (childTaxCredit) taxCredits += numDependents * 2000 // Child Tax Credit
    if (earnedIncomeCredit && grossIncome < 60000) taxCredits += Math.min(7430, grossIncome * 0.45) // Simplified EIC

    const finalTax = Math.max(0, federalTax - taxCredits)
    const effectiveTaxRate = grossIncome > 0 ? (finalTax / grossIncome) * 100 : 0
    const marginalTaxRate = getMarginalRate(taxableIncome, filingStatus)

    setResult({
      type: "individual",
      grossIncome,
      adjustedGrossIncome,
      totalDeductions,
      taxableIncome,
      federalTax,
      taxCredits,
      finalTax,
      effectiveTaxRate,
      marginalTaxRate,
      usingStandardDeduction: totalDeductions === standardDeduction,
      itemizedDeductions,
    })
  }

  const calculateBusinessTax = () => {
    const income = Number.parseFloat(businessIncome) || 0
    const expenses = Number.parseFloat(businessExpenses) || 0
    const homeOfficeDeduction = Number.parseFloat(homeOffice) || 0
    const vehicleDeduction = Number.parseFloat(vehicleExpenses) || 0
    const equipmentDeduction = Number.parseFloat(equipment) || 0

    const totalDeductions = expenses + homeOfficeDeduction + vehicleDeduction + equipmentDeduction
    const netBusinessIncome = Math.max(0, income - totalDeductions)

    // Self-employment tax (15.3% on net earnings)
    const selfEmploymentTax = netBusinessIncome * 0.9235 * 0.153 // 92.35% of net earnings subject to SE tax
    const deductibleSETax = selfEmploymentTax * 0.5 // Half of SE tax is deductible

    // Federal income tax on business income
    const adjustedBusinessIncome = netBusinessIncome - deductibleSETax
    const federalTaxRate = income > 100000 ? 0.24 : income > 50000 ? 0.22 : 0.12
    const federalTax = adjustedBusinessIncome * federalTaxRate

    const totalTax = federalTax + selfEmploymentTax
    const effectiveTaxRate = income > 0 ? (totalTax / income) * 100 : 0

    // Calculate tax savings from deductions
    const taxWithoutDeductions = income * federalTaxRate + income * 0.9235 * 0.153
    const taxSavings = taxWithoutDeductions - totalTax

    setResult({
      type: "business",
      income,
      totalDeductions,
      netBusinessIncome,
      selfEmploymentTax,
      deductibleSETax,
      federalTax,
      totalTax,
      effectiveTaxRate,
      taxSavings,
    })
  }

  const getMarginalRate = (taxableIncome: number, status: string) => {
    if (status === "single") {
      if (taxableIncome > 609350) return 37
      if (taxableIncome > 243725) return 35
      if (taxableIncome > 191950) return 32
      if (taxableIncome > 100525) return 24
      if (taxableIncome > 47150) return 22
      if (taxableIncome > 11000) return 12
      return 10
    } else if (status === "married") {
      if (taxableIncome > 731200) return 37
      if (taxableIncome > 487450) return 35
      if (taxableIncome > 383900) return 32
      if (taxableIncome > 201050) return 24
      if (taxableIncome > 94300) return 22
      if (taxableIncome > 22000) return 12
      return 10
    }
    return 10
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
                    <Receipt className="h-6 w-6 text-blue-600" />
                    Comprehensive Tax Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate your federal taxes for individuals and businesses with detailed deductions and credits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs value={taxType} onValueChange={setTaxType} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="individual" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Individual Tax
                      </TabsTrigger>
                      <TabsTrigger value="business" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Business Tax
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="individual" className="space-y-6">
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
                          <Label htmlFor="income">Annual Income ($)</Label>
                          <Input
                              id="income"
                              type="number"
                              placeholder="75000"
                              value={income}
                              onChange={(e) => setIncome(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dependents">Number of Dependents</Label>
                          <Input
                              id="dependents"
                              type="number"
                              placeholder="0"
                              value={dependents}
                              onChange={(e) => setDependents(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Deductions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="mortgageInterest">Mortgage Interest ($)</Label>
                            <Input
                                id="mortgageInterest"
                                type="number"
                                placeholder="12000"
                                value={mortgageInterest}
                                onChange={(e) => setMortgageInterest(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="charitableDonations">Charitable Donations ($)</Label>
                            <Input
                                id="charitableDonations"
                                type="number"
                                placeholder="3000"
                                value={charitableDonations}
                                onChange={(e) => setCharitableDonations(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="stateLocalTax">State & Local Taxes ($)</Label>
                            <Input
                                id="stateLocalTax"
                                type="number"
                                placeholder="8000"
                                value={stateLocalTax}
                                onChange={(e) => setStateLocalTax(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="medicalExpenses">Medical Expenses ($)</Label>
                            <Input
                                id="medicalExpenses"
                                type="number"
                                placeholder="5000"
                                value={medicalExpenses}
                                onChange={(e) => setMedicalExpenses(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="studentLoanInterest">Student Loan Interest ($)</Label>
                            <Input
                                id="studentLoanInterest"
                                type="number"
                                placeholder="2000"
                                value={studentLoanInterest}
                                onChange={(e) => setStudentLoanInterest(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Tax Credits</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="childTaxCredit" checked={childTaxCredit} onCheckedChange={(checked) => setChildTaxCredit(Boolean(checked))} />
                            <Label htmlFor="childTaxCredit">Child Tax Credit ($2,000 per child)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                                id="earnedIncomeCredit"
                                checked={earnedIncomeCredit}
                                onCheckedChange={(checked) => setEarnedIncomeCredit(Boolean(checked))}
                            />
                            <Label htmlFor="earnedIncomeCredit">Earned Income Tax Credit</Label>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessIncome">Annual Business Income ($)</Label>
                          <Input
                              id="businessIncome"
                              type="number"
                              placeholder="150000"
                              value={businessIncome}
                              onChange={(e) => setBusinessIncome(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessExpenses">Business Expenses ($)</Label>
                          <Input
                              id="businessExpenses"
                              type="number"
                              placeholder="25000"
                              value={businessExpenses}
                              onChange={(e) => setBusinessExpenses(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="homeOffice">Home Office Deduction ($)</Label>
                          <Input
                              id="homeOffice"
                              type="number"
                              placeholder="5000"
                              value={homeOffice}
                              onChange={(e) => setHomeOffice(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vehicleExpenses">Vehicle/Travel Expenses ($)</Label>
                          <Input
                              id="vehicleExpenses"
                              type="number"
                              placeholder="8000"
                              value={vehicleExpenses}
                              onChange={(e) => setVehicleExpenses(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="equipment">Equipment/Depreciation ($)</Label>
                          <Input
                              id="equipment"
                              type="number"
                              placeholder="12000"
                              value={equipment}
                              onChange={(e) => setEquipment(e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button onClick={calculateTax} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Tax
                  </Button>

                  {result && (
                      <div className="calculator-result space-y-4">
                        <h3 className="text-lg font-semibold text-blue-800">
                          {result.type === "individual" ? "Your Tax Calculation" : "Your Business Tax Analysis"}
                        </h3>

                        {result.type === "individual" ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Federal Tax Owed</p>
                                  <p className="text-3xl font-bold text-red-600">${result.finalTax.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Effective Tax Rate</p>
                                  <p className="text-2xl font-bold text-blue-600">{result.effectiveTaxRate.toFixed(1)}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Marginal Tax Rate</p>
                                  <p className="text-2xl font-bold text-purple-600">{result.marginalTaxRate}%</p>
                                </div>
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3">Tax Breakdown:</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Gross Income:</span>
                                    <span>${result.grossIncome.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Adjusted Gross Income:</span>
                                    <span>${result.adjustedGrossIncome.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{result.usingStandardDeduction ? "Standard" : "Itemized"} Deduction:</span>
                                    <span className="text-green-600">-${result.totalDeductions.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span>Taxable Income:</span>
                                    <span className="font-semibold">${result.taxableIncome.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Federal Tax Before Credits:</span>
                                    <span>${result.federalTax.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tax Credits:</span>
                                    <span className="text-green-600">-${result.taxCredits.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2 font-semibold">
                                    <span>Final Tax Owed:</span>
                                    <span>${result.finalTax.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {!result.usingStandardDeduction && (
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2 text-blue-800">Itemized Deductions Breakdown:</h4>
                                    <p className="text-sm text-blue-700">
                                      Your itemized deductions (${result.itemizedDeductions.toLocaleString()}) exceed the
                                      standard deduction, saving you $
                                      {(
                                          result.itemizedDeductions -
                                          (filingStatus === "married" ? 29200 : filingStatus === "head" ? 21900 : 14600)
                                      ).toLocaleString()}{" "}
                                      in taxable income.
                                    </p>
                                  </div>
                              )}
                            </>
                        ) : (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Estimated Tax Savings</p>
                                  <p className="text-3xl font-bold text-green-600">${result.taxSavings.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Total Tax Owed</p>
                                  <p className="text-2xl font-bold text-red-600">${result.totalTax.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Effective Tax Rate</p>
                                  <p className="text-2xl font-bold text-purple-600">{result.effectiveTaxRate.toFixed(1)}%</p>
                                </div>
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3">Business Tax Breakdown:</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Business Income:</span>
                                    <span>${result.income.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Business Deductions:</span>
                                    <span className="text-green-600">-${result.totalDeductions.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span>Net Business Income:</span>
                                    <span className="font-semibold">${result.netBusinessIncome.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Self-Employment Tax:</span>
                                    <span>${result.selfEmploymentTax.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Federal Income Tax:</span>
                                    <span>${result.federalTax.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2 font-semibold">
                                    <span>Total Tax:</span>
                                    <span>${result.totalTax.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                        )}

                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Disclaimer:</strong> This calculator provides estimates based on 2024 federal tax rates
                            and standard deductions. State taxes, alternative minimum tax, and other factors are not
                            included. Consult a tax professional for comprehensive tax planning.
                          </p>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                            <Share2 className="h-4 w-4" />
                            Share Results
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                            <Download className="h-4 w-4" />
                            Download Tax Summary
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