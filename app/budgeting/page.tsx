"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Calculator,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  Target,
  AlertCircle,
  PiggyBankIcon as Piggy,
  Trash2,
  Edit,
} from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { SaveIndicator } from "@/components/save-indicator"
import Link from "next/link"
import Papa from "papaparse"

// ... (keep the BudgetItem and SavingsGoal interfaces as they are)

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

interface ParsedTransaction {
  Description: string;
  Amount: number;
  // This will be set by the user in the modal
  category?: string;
}


// Define a color palette for the pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1943", "#19D7FF"];

export default function BudgetingPage() {
  const [budgetItems, setBudgetItems, clearBudgetItems] = useLocalStorage<BudgetItem[]>("finnacalc-budget-items", [])
  const [savingsGoals, setSavingsGoals, clearSavingsGoals] = useLocalStorage<SavingsGoal[]>(
      "finnacalc-savings-goals",
      [],
  )
  const [lastSaved, setLastSaved] = useState<Date | undefined>()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  // State for CSV import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const initialFormState = {
    category: "",
    subcategory: "",
    amount: "",
    frequency: "monthly" as const,
    type: "expense" as const,
    isFixed: false,
  };

  const [newItem, setNewItem] = useState(initialFormState);

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

  useEffect(() => {
    if (budgetItems.length > 0 || savingsGoals.length > 0) {
      const cleanup = autoSave()
      return cleanup
    }
  }, [budgetItems, savingsGoals, autoSave])

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

  const handleFormSubmit = () => {
    if (editingItemId) {
      setBudgetItems(budgetItems.map(item =>
          item.id === editingItemId
              ? {
                ...item,
                category: newItem.category,
                subcategory: newItem.subcategory,
                amount: Number.parseFloat(newItem.amount),
                frequency: newItem.frequency,
                type: newItem.type,
                isFixed: newItem.isFixed,
              }
              : item
      ));
      setEditingItemId(null);
    } else {
      if (newItem.category && newItem.amount) {
        const itemToAdd: BudgetItem = {
          id: Date.now().toString(),
          category: newItem.category,
          subcategory: newItem.subcategory,
          amount: Number.parseFloat(newItem.amount),
          frequency: newItem.frequency,
          type: newItem.type,
          isFixed: newItem.isFixed,
        }
        setBudgetItems([...budgetItems, itemToAdd]);
      }
    }
    setNewItem(initialFormState);
  }

  const handleEditClick = (itemToEdit: BudgetItem) => {
    setEditingItemId(itemToEdit.id);
    setNewItem({
      ...itemToEdit,
      amount: itemToEdit.amount.toString(),
    });
  }

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setNewItem(initialFormState);
  }

  const removeBudgetItem = (id: string, itemName: string) => {
    if (confirm(`Are you sure you want to delete "${itemName}"? This cannot be undone.`)) {
      setBudgetItems(budgetItems.filter((item) => item.id !== id))
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const transactions = results.data.map((row: any) => ({
            // Assumes columns are named 'Description' and 'Amount'
            Description: row.Description || row.description || '',
            Amount: parseFloat(row.Amount || row.amount || 0),
          })).filter(t => t.Description && t.Amount);

          setParsedTransactions(transactions);
          setIsImportModalOpen(true);
        },
      });
    }
  };

  const handleTransactionCategoryChange = (index: number, category: string) => {
    const updated = [...parsedTransactions];
    updated[index].category = category;
    setParsedTransactions(updated);
  };

  const handleImportConfirm = () => {
    const newBudgetItems = parsedTransactions
        .filter(t => t.category) // Only import items with a category
        .map((t, i) => ({
          id: `imported-${Date.now()}-${i}`,
          category: t.category!,
          subcategory: t.Description,
          amount: Math.abs(t.Amount),
          type: t.Amount < 0 ? 'expense' : 'income',
          frequency: 'monthly' as const, // Assuming monthly for simplicity
          isFixed: false,
        }));

    setBudgetItems([...budgetItems, ...newBudgetItems]);
    setIsImportModalOpen(false);
    setParsedTransactions([]);
  };


  // ... (keep the rest of your functions like addSavingsGoal, removeSavingsGoal, etc.)
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

  // Prepare data for the Pie Chart
  const pieChartData = Object.keys(expenseCategories).map(key => ({
    name: key,
    value: expenseCategories[key]
  }));


  const getRecommendations = () => {
    const recommendations = []

    if (monthlyNet < 0) {
      recommendations.push({
        type: "warning",
        title: "Budget Deficit Alert",
        message: `You're spending $${Math.abs(monthlyNet).toFixed(2)} more than you earn monthly. Consider reducing expenses or increasing income to avoid debt accumulation.`,
      })
    }

    if (monthlyIncome > 0 && monthlyNet > 0 && monthlyNet < monthlyIncome * 0.2) {
      recommendations.push({
        type: "info",
        title: "Low Savings Rate",
        message: `Try to save at least 20% of your income for financial security. You're currently saving ${((monthlyNet / monthlyIncome) * 100).toFixed(1)}%. Consider reducing discretionary spending.`,
      })
    }

    const housingCost = expenseCategories["Housing"] || 0
    if (monthlyIncome > 0 && housingCost > monthlyIncome * 0.3) {
      recommendations.push({
        type: "warning",
        title: "High Housing Costs",
        message: `Housing costs should ideally be under 30% of income. Yours is ${((housingCost / monthlyIncome) * 100).toFixed(1)}%. Consider downsizing or finding additional income sources.`,
      })
    }

    const foodCost = expenseCategories["Food"] || 0
    if (monthlyIncome > 0 && foodCost > monthlyIncome * 0.15) {
      recommendations.push({
        type: "info",
        title: "Food Spending Analysis",
        message: `Your food expenses are ${((foodCost / monthlyIncome) * 100).toFixed(1)}% of income. Consider meal planning, cooking at home more often, or using grocery budgeting apps to reduce costs.`,
      })
    }

    const entertainmentCost = expenseCategories["Entertainment"] || 0
    if (monthlyIncome > 0 && entertainmentCost > monthlyIncome * 0.1) {
      recommendations.push({
        type: "info",
        title: "Entertainment Spending",
        message: `Entertainment costs are ${((entertainmentCost / monthlyIncome) * 100).toFixed(1)}% of income. Look for free activities, use streaming services instead of cable, or set a monthly entertainment budget.`,
      })
    }

    const transportationCost = expenseCategories["Transportation"] || 0
    if (monthlyIncome > 0 && transportationCost > monthlyIncome * 0.15) {
      recommendations.push({
        type: "info",
        title: "Transportation Costs",
        message: `Transportation is ${((transportationCost / monthlyIncome) * 100).toFixed(1)}% of income. Consider carpooling, public transit, or working from home to reduce these expenses.`,
      })
    }

    // Positive recommendations
    if (monthlyIncome > 0 && monthlyNet >= monthlyIncome * 0.2) {
      recommendations.push({
        type: "success",
        title: "Excellent Savings Rate!",
        message: `You're saving ${((monthlyNet / monthlyIncome) * 100).toFixed(1)}% of your income. Consider investing this surplus in retirement accounts or building an emergency fund.`,
      })
    }

    return recommendations
  }

  return (
      <>
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
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".csv"
                  />
                  <Button
                      variant="outline"
                      className="hidden sm:flex items-center gap-2"
                      onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden md:inline">Import CSV</span>
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

            {/* ... (keep Overview Cards and Tabs component as they are) */}
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
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
                <TabsTrigger value="budget" className="text-xs sm:text-sm">
                  Budget
                </TabsTrigger>
                <TabsTrigger value="analysis" className="text-xs sm:text-sm">
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="goals" className="text-xs sm:text-sm">
                  Savings Goals
                </TabsTrigger>
              </TabsList>
              <TabsContent value="budget" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add/Edit Income/Expense */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingItemId ? 'Edit Item' : 'Add Income or Expense'}</CardTitle>
                      <CardDescription>
                        {editingItemId ? 'Update the details of your item below.' : 'Track your financial inflows and outflows'}
                      </CardDescription>
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

                      <div className="flex gap-2">
                        {editingItemId && (
                            <Button variant="outline" onClick={handleCancelEdit} className="w-full">
                              Cancel
                            </Button>
                        )}
                        <Button onClick={handleFormSubmit} className="w-full">
                          {editingItemId ? 'Update Item' : 'Add to Budget'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Budget Summary (PIE CHART) */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Budget Summary</CardTitle>
                      <CardDescription>A visual breakdown of your monthly expenses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pieChartData.length > 0 ? (
                          <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                  {pieChartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                      ) : (
                          <div className="flex items-center justify-center h-full min-h-[250px]">
                            <p className="text-gray-500 text-sm text-center">Your expense summary chart will appear here.</p>
                          </div>
                      )}
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
                              <div>
                                <p className="font-medium truncate">{item.subcategory || 'No description'}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
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
                                  onClick={() => handleEditClick(item)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                                  title="Edit this item"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
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
            </Tabs>
          </div>
        </div>
      </>
  )
}
