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
  PlusCircle,
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
  category?: string;
}

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

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState({ description: '', amount: '', credit: '', debit: '' });
  const [amountType, setAmountType] = useState('single');
  const [categorizedTransactions, setCategorizedTransactions] = useState<ParsedTransaction[]>([]);
  const [importStep, setImportStep] = useState(1);

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
          setCsvHeaders(results.meta.fields || []);
          setCsvData(results.data);
          setImportStep(1);
          setIsImportModalOpen(true);
        },
      });
    }
    if (event.target) event.target.value = '';
  };

  const processMappedTransactions = () => {
    const cleanAmount = (value: any) => {
      if (typeof value !== 'string') return 0;
      return parseFloat(value.replace(/["$,]/g, '')) || 0;
    };

    const transactions = csvData.map(row => {
      let amount = 0;
      if (amountType === 'single') {
        amount = cleanAmount(row[columnMapping.amount]);
      } else {
        const credit = cleanAmount(row[columnMapping.credit]);
        const debit = cleanAmount(row[columnMapping.debit]);
        amount = credit - debit;
      }
      return {
        Description: row[columnMapping.description] || '',
        Amount: amount
      };
    }).filter(t => t.Description && !isNaN(t.Amount));

    setCategorizedTransactions(transactions);
    setImportStep(2);
  };

  const handleTransactionCategoryChange = (index: number, category: string) => {
    const updated = [...categorizedTransactions];
    updated[index].category = category;
    setCategorizedTransactions(updated);
  };

  const handleImportConfirm = () => {
    const newBudgetItems: BudgetItem[] = categorizedTransactions
        .filter(t => t.category)
        .map((t, i) => ({
          id: `imported-${Date.now()}-${i}`,
          category: t.category!,
          subcategory: t.Description,
          amount: Math.abs(t.Amount),
          type: t.Amount < 0 ? 'expense' : 'income',
          frequency: 'monthly',
          isFixed: false,
        }));

    setBudgetItems([...budgetItems, ...newBudgetItems]);
    setIsImportModalOpen(false);
  };

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

    // ... (rest of getRecommendations logic) ...
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
                        if (value === "budget-items") clearBudgetItems();
                        if (value === "savings-goals") clearSavingsGoals();
                        if (value === "all-data") clearAllData();
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

            <Tabs defaultValue="history" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="history">Budget History</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="goals">Savings Goals</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Import Bank Statement</CardTitle>
                    <CardDescription>Upload a CSV file from your bank to review and add transactions to your budget.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".csv"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                    <div className="mt-4 space-y-2">
                      {parsedTransactions.length > 0 ? (
                          parsedTransactions.map((t, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{t.Description}</p>
                                  <p className={t.Amount < 0 ? 'text-red-600' : 'text-green-600'}>${t.Amount.toFixed(2)}</p>
                                </div>
                                <Button size="sm" onClick={() => addTransactionToBudget(t, i)}>
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Add to Budget
                                </Button>
                              </div>
                          ))
                      ) : (
                          <p className="text-center text-gray-500 py-4">Upload a CSV file to see your transaction history here.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ... (rest of the tabs and their content) ... */}
              <TabsContent value="budget" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add/Edit Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingItemId ? 'Edit Item' : 'Add Income or Expense'}</CardTitle>
                      <CardDescription>
                        {editingItemId ? 'Update the details of your item below.' : 'Track your financial inflows and outflows'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* ... form content ... */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Type</Label>
                          <Select
                              value={newItem.type}
                              onValueChange={(value) => setNewItem({ ...newItem, type: value as "income" | "expense" })}
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
                              onValueChange={(value) => setNewItem({ ...newItem, frequency: value as "daily" | "weekly" | "monthly" | "yearly" })}
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
                  {/* Pie Chart Summary */}
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
                              <p className="font-medium truncate">{item.subcategory || 'No description'}</p>
                              <p className="text-xs text-gray-500">{item.category}</p>
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

              <TabsContent value="analysis" className="space-y-6">
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
                    {getRecommendations().length === 0 && budgetItems.length > 0 && (
                        <Alert className="border-green-200 bg-green-50">
                          <AlertCircle className="h-4 w-4" />
                          <div>
                            <h4 className="font-semibold">Great Job!</h4>
                            <AlertDescription>Your budget looks healthy. Keep up the good work!</AlertDescription>
                          </div>
                        </Alert>
                    )}
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Savings Goals Progress ({savingsGoals.length})</CardTitle>
                      <CardDescription>Track your progress toward financial goals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {savingsGoals.map((goal) => {
                          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
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
            </Tabs>
          </div>
        </div>

        <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Import Transactions</DialogTitle>
            </DialogHeader>

            {importStep === 1 && (
                <>
                  <DialogDescription>
                    Map the columns from your CSV file to the required fields.
                  </DialogDescription>
                  <div className="space-y-4">
                    <div>
                      <Label>Transaction Description</Label>
                      <Select onValueChange={value => setColumnMapping(prev => ({ ...prev, description: value }))}>
                        <SelectTrigger><SelectValue placeholder="Select description column..." /></SelectTrigger>
                        <SelectContent>
                          {csvHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount Format</Label>
                      <Select onValueChange={value => setAmountType(value)} defaultValue="single">
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single Amount Column (e.g., -50.25 for expenses)</SelectItem>
                          <SelectItem value="double">Separate Credit/Debit Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {amountType === 'single' ? (
                        <div>
                          <Label>Amount</Label>
                          <Select onValueChange={value => setColumnMapping(prev => ({ ...prev, amount: value }))}>
                            <SelectTrigger><SelectValue placeholder="Select amount column..." /></SelectTrigger>
                            <SelectContent>
                              {csvHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Credit (Income)</Label>
                            <Select onValueChange={value => setColumnMapping(prev => ({ ...prev, credit: value }))}>
                              <SelectTrigger><SelectValue placeholder="Select credit column..." /></SelectTrigger>
                              <SelectContent>
                                {csvHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Debit (Expense)</Label>
                            <Select onValueChange={value => setColumnMapping(prev => ({ ...prev, debit: value }))}>
                              <SelectTrigger><SelectValue placeholder="Select debit column..." /></SelectTrigger>
                              <SelectContent>
                                {csvHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                    <Button onClick={processMappedTransactions}>Next: Categorize</Button>
                  </DialogFooter>
                </>
            )}

            {importStep === 2 && (
                <>
                  <DialogDescription>
                    Please assign a category to each imported transaction before adding them to your budget.
                  </DialogDescription>
                  <div className="max-h-[60vh] overflow-y-auto p-1">
                    <div className="grid grid-cols-3 gap-4 font-medium sticky top-0 bg-background py-2">
                      <p>Description</p>
                      <p>Amount</p>
                      <p>Category</p>
                    </div>
                    {categorizedTransactions.map((t, i) => (
                        <div key={i} className="grid grid-cols-3 gap-4 items-center py-2 border-b">
                          <p className="truncate" title={t.Description}>{t.Description}</p>
                          <p className={t.Amount < 0 ? 'text-red-600' : 'text-green-600'}>${t.Amount.toFixed(2)}</p>
                          <Select onValueChange={(value) => handleTransactionCategoryChange(i, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
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
                              <SelectItem value="Salary">Salary</SelectItem>
                              <SelectItem value="Freelance">Freelance</SelectItem>
                              <SelectItem value="Business">Business Income</SelectItem>
                              <SelectItem value="Investments">Investment Returns</SelectItem>
                              <SelectItem value="Other Income">Other Income</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setImportStep(1)}>Back</Button>
                    <Button onClick={handleImportConfirm}>Add Items to Budget</Button>
                  </DialogFooter>
                </>
            )}
          </DialogContent>
        </Dialog>
      </>
  )
}