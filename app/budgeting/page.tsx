"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Calculator,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Target,
  AlertCircle,
  PiggyBankIcon as Piggy,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { SaveIndicator } from "@/components/save-indicator"
import Link from "next/link"

interface BudgetItem {
  id: string
  category: string
  subcategory: string
  amount: number
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  type: "income" | "expense"
  isFixed: boolean
}

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  monthlyContribution: number
}

export default function BudgetingPage() {
  // Use localStorage hooks for persistent data
  const [budgetItems, setBudgetItems, clearBudgetItems] = useLocalStorage<BudgetItem[]>("finnacalc-budget-items", [])
  const [savingsGoals, setSavingsGoals, clearSavingsGoals] = useLocalStorage<SavingsGoal[]>(
      "finnacalc-savings-goals",
      [],
  )
  const [lastSaved, setLastSaved] = useState<Date | undefined>()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [newItem, setNewItem] = useState({
    category: "",
    subcategory: "",
    amount: "",
    frequency: "monthly" as const,
    type: "expense" as const,
    isFixed: false,
  })
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
    monthlyContribution: "",
  })

  // Auto-save functionality
  const autoSave = useCallback(() => {
    setHasUnsavedChanges(true)
    const timer = setTimeout(() => {
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Trigger auto-save when data changes
  useEffect(() => {
    if (budgetItems.length > 0 || savingsGoals.length > 0) {
      const cleanup = autoSave()
      return cleanup
    }
  }, [budgetItems, savingsGoals, autoSave])

  // Convert all amounts to monthly for calculations
  const convertToMonthly = (amount: number, frequency: string) => {
    const multipliers = { daily: 30, weekly: 4.33, monthly: 1, yearly: 1 / 12 }
    return amount * (multipliers[frequency as keyof typeof multipliers] || 1)
  }

  const monthlyIncome = budgetItems
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + convertToMonthly(item.amount, item.frequency), 0)

  const monthlyExpenses = budgetItems
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + convertToMonthly(item.amount, item.frequency), 0)

  const monthlyNet = monthlyIncome - monthlyExpenses

  const addBudgetItem = () => {
    if (newItem.category && newItem.amount) {
      const item: BudgetItem = {
        id: Date.now().toString(),
        category: newItem.category,
        subcategory: newItem.subcategory,
        amount: Number.parseFloat(newItem.amount),
        frequency: newItem.frequency,
        type: newItem.type,
        isFixed: newItem.isFixed,
      }
      setBudgetItems([...budgetItems, item])
      setNewItem({
        category: "",
        subcategory: "",
        amount: "",
        frequency: "monthly",
        type: "expense",
        isFixed: false,
      })
    }
  }

  const removeBudgetItem = (id: string, itemName: string) => {
    if (confirm(`Are you sure you want to delete "${itemName}"? This cannot be undone.`)) {
      setBudgetItems(budgetItems.filter((item) => item.id !== id))
    }
  }

  const addSavingsGoal = () => {
    if (newGoal.name && newGoal.targetAmount) {
      const goal: SavingsGoal = {
        id: Date.now().toString(),
        name: newGoal.name,
        targetAmount: Number.parseFloat(newGoal.targetAmount),
        currentAmount: Number.parseFloat(newGoal.currentAmount) || 0,
        targetDate: newGoal.targetDate,
        monthlyContribution: Number.parseFloat(newGoal.monthlyContribution) || 0,
      }
      setSavingsGoals([...savingsGoals, goal])
      setNewGoal({
        name: "",
        targetAmount: "",
        currentAmount: "",
        targetDate: "",
        monthlyContribution: "",
      })
    }
  }

  const removeSavingsGoal = (id: string, goalName: string) => {
    if (confirm(`Are you sure you want to delete the savings goal "${goalName}"? This cannot be undone.`)) {
      setSavingsGoals(savingsGoals.filter((goal) => goal.id !== id))
    }
  }

  const updateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setSavingsGoals(savingsGoals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)))
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all your budget data? This cannot be undone.")) {
      clearBudgetItems()
      clearSavingsGoals()
      setLastSaved(undefined)
    }
  }

  const exportData = () => {
    const data = {
      budgetItems,
      savingsGoals,
      exportDate: new Date().toISOString(),
      monthlyIncome,
      monthlyExpenses,
      monthlyNet,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finnacalc-budget-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const expenseCategories = budgetItems
      .filter((item) => item.type === "expense")
      .reduce(
          (acc, item) => {
            const monthly = convertToMonthly(item.amount, item.frequency)
            acc[item.category] = (acc[item.category] || 0) + monthly
            return acc
          },
          {} as Record<string, number>,
      )

  const getRecommendations = () => {
    const recommendations = []

    if (monthlyNet < 0) {
      recommendations.push({
        type: "warning",
        title: "Budget Deficit Alert",
        message: `You're spending $${Math.abs(monthlyNet).toFixed(2)} more than you earn monthly. Consider reducing expenses or increasing income to avoid debt accumulation.`,
      })
    }

    if (monthlyNet > 0 && monthlyNet < monthlyIncome * 0.2) {
      recommendations.push({
        type: "info",
        title: "Low Savings Rate",
        message: `Try to save at least 20% of your income for financial security. You're currently saving ${((monthlyNet / monthlyIncome) * 100).toFixed(1)}%. Consider reducing discretionary spending.`,
      })
    }

    const housingCost = expenseCategories["Housing"] || 0
    if (housingCost > monthlyIncome * 0.3) {
      recommendations.push({
        type: "warning",
        title: "High Housing Costs",
        message: `Housing costs should ideally be under 30% of income. Yours is ${((housingCost / monthlyIncome) * 100).toFixed(1)}%. Consider downsizing or finding additional income sources.`,
      })
    }

    const foodCost = expenseCategories["Food"] || 0
    if (foodCost > monthlyIncome * 0.15) {
      recommendations.push({
        type: "info",
        title: "Food Spending Analysis",
        message: `Your food expenses are ${((foodCost / monthlyIncome) * 100).toFixed(1)}% of income. Consider meal planning, cooking at home more often, or using grocery budgeting apps to reduce costs.`,
      })
    }

    const entertainmentCost = expenseCategories["Entertainment"] || 0
    if (entertainmentCost > monthlyIncome * 0.1) {
      recommendations.push({
        type: "info",
        title: "Entertainment Spending",
        message: `Entertainment costs are ${((entertainmentCost / monthlyIncome) * 100).toFixed(1)}% of income. Look for free activities, use streaming services instead of cable, or set a monthly entertainment budget.`,
      })
    }

    const transportationCost = expenseCategories["Transportation"] || 0
    if (transportationCost > monthlyIncome * 0.15) {
      recommendations.push({
        type: "info",
        title: "Transportation Costs",
        message: `Transportation is ${((transportationCost / monthlyIncome) * 100).toFixed(1)}% of income. Consider carpooling, public transit, or working from home to reduce these expenses.`,
      })
    }

    // Positive recommendations
    if (monthlyNet >= monthlyIncome * 0.2) {
      recommendations.push({
        type: "success",
        title: "Excellent Savings Rate!",
        message: `You're saving ${((monthlyNet / monthlyIncome) * 100).toFixed(1)}% of your income. Consider investing this surplus in retirement accounts or building an emergency fund.`,
      })
    }

    return recommendations
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
              <div className="flex items-center gap-2 sm:gap-4">
                <SaveIndicator lastSaved={lastSaved} hasUnsavedChanges={hasUnsavedChanges} />
                <Button variant="outline" className="hidden sm:flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden md:inline">Import Bank Statement</span>
                  <span className="text-xs text-gray-500">(Coming Soon)</span>
                </Button>
                <Link href="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Personal Budget Planner</h1>
                <p className="text-gray-600">Take control of your finances with our comprehensive budgeting tool</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
                <Select
                    onValueChange={(value) => {
                      if (value === "budget-items" && budgetItems.length > 0) {
                        if (confirm("Are you sure you want to clear all budget items? This cannot be undone.")) {
                          setBudgetItems([])
                        }
                      } else if (value === "savings-goals" && savingsGoals.length > 0) {
                        if (confirm("Are you sure you want to clear all savings goals? This cannot be undone.")) {
                          setSavingsGoals([])
                        }
                      } else if (value === "all-data") {
                        clearAllData()
                      }
                    }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Clear Data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget-items">Clear Budget Items</SelectItem>
                    <SelectItem value="savings-goals">Clear Savings Goals</SelectItem>
                    <SelectItem value="all-data">Clear All Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Income</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">${monthlyIncome.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Expenses</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">${monthlyExpenses.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Net Income</p>
                    <p className={`text-xl sm:text-2xl font-bold ${monthlyNet >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${monthlyNet.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign
                      className={`h-6 w-6 sm:h-8 sm:w-8 ${monthlyNet >= 0 ? "text-green-600" : "text-red-600"}`}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Savings Rate</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {monthlyIncome > 0 ? ((monthlyNet / monthlyIncome) * 100).toFixed(1) : "0.0"}%
                    </p>
                  </div>
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="budget" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="budget" className="text-xs sm:text-sm">
                Budget
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs sm:text-sm">
                Analysis
              </TabsTrigger>
              <TabsTrigger value="goals" className="text-xs sm:text-sm">
                Savings Goals
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-xs sm:text-sm">
                Calculator Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="budget" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Income/Expense */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add Income or Expense</CardTitle>
                    <CardDescription>Track your financial inflows and outflows</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select
                            value={newItem.type}
                            onValueChange={(value: "income" | "expense") => setNewItem({ ...newItem, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select
                            value={newItem.frequency}
                            onValueChange={(value: any) => setNewItem({ ...newItem, frequency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Category</Label>
                      <Select
                          value={newItem.category}
                          onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {newItem.type === "income" ? (
                              <>
                                <SelectItem value="Salary">Salary</SelectItem>
                                <SelectItem value="Freelance">Freelance</SelectItem>
                                <SelectItem value="Business">Business Income</SelectItem>
                                <SelectItem value="Investments">Investment Returns</SelectItem>
                                <SelectItem value="Other Income">Other Income</SelectItem>
                              </>
                          ) : (
                              <>
                                <SelectItem value="Housing">Housing</SelectItem>
                                <SelectItem value="Transportation">Transportation</SelectItem>
                                <SelectItem value="Food">Food & Dining</SelectItem>
                                <SelectItem value="Utilities">Utilities</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                <SelectItem value="Entertainment">Entertainment</SelectItem>
                                <SelectItem value="Shopping">Shopping</SelectItem>
                                <SelectItem value="Insurance">Insurance</SelectItem>
                                <SelectItem value="Debt">Debt Payments</SelectItem>
                                <SelectItem value="Savings">Savings</SelectItem>
                                <SelectItem value="Other">Other Expenses</SelectItem>
                              </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Input
                          placeholder="e.g., Rent, Groceries, Netflix"
                          value={newItem.subcategory}
                          onChange={(e) => setNewItem({ ...newItem, subcategory: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Amount ($)</Label>
                      <Input
                          type="number"
                          placeholder="0.00"
                          value={newItem.amount}
                          onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                          type="checkbox"
                          id="isFixed"
                          checked={newItem.isFixed}
                          onChange={(e) => setNewItem({ ...newItem, isFixed: e.target.checked })}
                      />
                      <Label htmlFor="isFixed">Fixed amount (doesn't vary month to month)</Label>
                    </div>

                    <Button onClick={addBudgetItem} className="w-full">
                      Add to Budget
                    </Button>
                  </CardContent>
                </Card>

                {/* Budget Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Summary</CardTitle>
                    <CardDescription>A list of your monthly expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {budgetItems
                          .filter((item) => item.type === 'expense')
                          .map((item) => {
                            const monthlyAmount = convertToMonthly(item.amount, item.frequency);
                            return (
                                <div key={item.id} className="flex justify-between items-center">
                                  <span className="text-sm font-medium truncate">{item.subcategory || item.category}</span>
                                  <div className="text-right flex items-center gap-3">
                                    <span className="text-sm font-bold">${monthlyAmount.toFixed(2)}</span>
                                    <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                          className="bg-blue-600 h-2 rounded-full"
                                          style={{ width: monthlyExpenses > 0 ? `${Math.min((monthlyAmount / monthlyExpenses) * 100, 100)}%` : '0%' }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                            );
                          })}
                      {budgetItems.filter((item) => item.type === 'expense').length === 0 && (
                          <p className="text-gray-500 text-sm text-center py-4">Your expenses will appear here.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Budget Items List */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Items ({budgetItems.length})</CardTitle>
                  <CardDescription>All your income and expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {budgetItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate">{item.subcategory || item.category}</span>
                            <span className="text-sm text-gray-500 ml-2">({item.frequency})</span>
                            {item.isFixed && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">Fixed</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right flex-shrink-0">
                          <span className={`font-bold ${item.type === "income" ? "text-green-600" : "text-red-600"}`}>
                            {item.type === "income" ? "+" : "-"}${item.amount.toFixed(2)}
                          </span>
                              <div className="text-xs text-gray-500">
                                ${convertToMonthly(item.amount, item.frequency).toFixed(2)}/month
                              </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBudgetItem(item.id, item.subcategory || item.category)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                title="Delete this item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                    ))}
                    {budgetItems.length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          No budget items yet. Add your first income or expense above!
                        </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Health Analysis</CardTitle>
                  <CardDescription>Personalized recommendations based on your budget</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getRecommendations().map((rec, index) => (
                      <Alert
                          key={index}
                          className={
                            rec.type === "warning"
                                ? "border-orange-200 bg-orange-50"
                                : rec.type === "success"
                                    ? "border-green-200 bg-green-50"
                                    : "border-blue-200 bg-blue-50"
                          }
                      >
                        <AlertCircle className="h-4 w-4" />
                        <div>
                          <h4 className="font-semibold">{rec.title}</h4>
                          <AlertDescription>{rec.message}</AlertDescription>
                        </div>
                      </Alert>
                  ))}

                  {getRecommendations().length === 0 && budgetItems.length === 0 && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4" />
                        <div>
                          <h4 className="font-semibold">Get Started</h4>
                          <AlertDescription>
                            Add your income and expenses in the Budget tab to see personalized financial analysis and
                            recommendations.
                          </AlertDescription>
                        </div>
                      </Alert>
                  )}

                  {getRecommendations().length === 0 && budgetItems.length > 0 && (
                      <Alert className="border-green-200 bg-green-50">
                        <AlertCircle className="h-4 w-4" />
                        <div>
                          <h4 className="font-semibold">Great Job!</h4>
                          <AlertDescription>Your budget looks healthy. Keep up the good work!</AlertDescription>
                        </div>
                      </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Expense Breakdown Chart */}
              {Object.keys(expenseCategories).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Expense Breakdown</CardTitle>
                      <CardDescription>Where your money goes each month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(expenseCategories)
                            .sort(([, a], [, b]) => b - a)
                            .map(([category, amount]) => (
                                <div key={category} className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">{category}</span>
                                    <span className="text-sm">
                              ${amount.toFixed(2)} ({((amount / monthlyExpenses) * 100).toFixed(1)}%)
                            </span>
                                  </div>
                                  <Progress value={(amount / monthlyExpenses) * 100} className="h-2" />
                                </div>
                            ))}
                      </div>
                    </CardContent>
                  </Card>
              )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Savings Goal */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add Savings Goal</CardTitle>
                    <CardDescription>Set and track your financial goals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Goal Name</Label>
                      <Input
                          placeholder="e.g., Emergency Fund, Vacation, New Car"
                          value={newGoal.name}
                          onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Target Amount ($)</Label>
                        <Input
                            type="number"
                            placeholder="10000"
                            value={newGoal.targetAmount}
                            onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Current Amount ($)</Label>
                        <Input
                            type="number"
                            placeholder="2000"
                            value={newGoal.currentAmount}
                            onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Target Date</Label>
                        <Input
                            type="date"
                            value={newGoal.targetDate}
                            onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Monthly Contribution ($)</Label>
                        <Input
                            type="number"
                            placeholder="500"
                            value={newGoal.monthlyContribution}
                            onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={addSavingsGoal} className="w-full">
                      Add Savings Goal
                    </Button>
                  </CardContent>
                </Card>

                {/* Goals Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Savings Goals Progress ({savingsGoals.length})</CardTitle>
                    <CardDescription>Track your progress toward financial goals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {savingsGoals.map((goal) => {
                        const progress = (goal.currentAmount / goal.targetAmount) * 100
                        const remaining = goal.targetAmount - goal.currentAmount
                        const monthsToGoal =
                            goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : 0

                        return (
                            <div key={goal.id} className="space-y-3 p-4 border rounded-lg">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <Piggy className="h-8 w-8 text-pink-500" />
                                    <div
                                        className="absolute inset-0 bg-gradient-to-t from-green-400 to-transparent rounded-full opacity-60"
                                        style={{ height: `${Math.min(progress, 100)}%`, bottom: 0 }}
                                    />
                                  </div>
                                  <span className="font-medium">{goal.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                ${goal.currentAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}
                              </span>
                                  <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSavingsGoal(goal.id, goal.name)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                                      title="Delete this goal"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <Progress value={Math.min(progress, 100)} className="h-3" />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{progress.toFixed(1)}% complete</span>
                                {monthsToGoal > 0 && <span>{monthsToGoal} months to goal</span>}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Add amount"
                                    className="text-sm"
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        const input = e.target as HTMLInputElement
                                        const addAmount = Number.parseFloat(input.value)
                                        if (addAmount > 0) {
                                          updateSavingsGoal(goal.id, {
                                            currentAmount: goal.currentAmount + addAmount,
                                          })
                                          input.value = ""
                                        }
                                      }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                      const input = (e.target as HTMLElement).parentElement?.querySelector(
                                          "input",
                                      ) as HTMLInputElement
                                      const addAmount = Number.parseFloat(input.value)
                                      if (addAmount > 0) {
                                        updateSavingsGoal(goal.id, {
                                          currentAmount: goal.currentAmount + addAmount,
                                        })
                                        input.value = ""
                                      }
                                    }}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                        )
                      })}
                      {savingsGoals.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No savings goals yet. Add one to get started!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Calculator Tools</CardTitle>
                  <CardDescription>Use our specialized calculators for detailed financial planning</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/emergency-fund-calculator">
                      <Button variant="outline" className="w-full h-20 flex flex-col">
                        <DollarSign className="h-6 w-6 mb-2" />
                        Emergency Fund Calculator
                      </Button>
                    </Link>
                    <Link href="/loan-calculator">
                      <Button variant="outline" className="w-full h-20 flex flex-col">
                        <Calculator className="h-6 w-6 mb-2" />
                        Loan Calculator
                      </Button>
                    </Link>
                    <Link href="/roi-calculator">
                      <Button variant="outline" className="w-full h-20 flex flex-col">
                        <TrendingUp className="h-6 w-6 mb-2" />
                        Investment ROI Calculator
                      </Button>
                    </Link>
                    <Link href="/break-even-calculator">
                      <Button variant="outline" className="w-full h-20 flex flex-col">
                        <PieChart className="h-6 w-6 mb-2" />
                        Break-Even Calculator
                      </Button>
                    </Link>
                    <Link href="/cash-flow-calculator">
                      <Button variant="outline" className="w-full h-20 flex flex-col">
                        <TrendingUp className="h-6 w-6 mb-2" />
                        Cash Flow Projector
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline" className="w-full h-20 flex flex-col">
                        <Calculator className="h-6 w-6 mb-2" />
                        View All Calculators
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button variant="outline" className="flex items-center gap-2" onClick={exportData}>
              <Download className="h-4 w-4" />
              Export Budget Data
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upgrade for Bank Linking and Advanced Analysis
            </Button>
          </div>
        </div>
      </div>
  )
}