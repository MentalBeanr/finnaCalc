"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    AlertCircle,
    Trash2,
    Edit,
    History,
    PlusCircle,
    Save,
    CalendarDays,
    XCircle,
    Lightbulb,
    ThumbsUp,
    Award,
} from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocalStorage } from "@/hooks/use-local-storage"
import Link from "next/link"
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from "sonner"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
const convertToMonthly = (amount: number, frequency: string): number => {
    switch (frequency) {
        case 'Weekly':
            return amount * 4.33; // Average weeks in a month
        case 'Bi-Weekly':
            return amount * 2.167; // Average bi-weekly periods in a month
        case 'Monthly':
            return amount;
        case 'Yearly':
            return amount / 12;
        default:
            return 0;
    }
};
interface BudgetItem {
    id: string
    category: string
    subcategory: string
    amount: number
    frequency: "daily" | "weekly" | "monthly" | "yearly"
    type: "income" | "expense"
    isFixed: boolean
    budgetType: "personal" | "business"
    importDate?: string
}

interface SavingsGoal {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    targetDate: string
    monthlyContribution: number
}

interface BudgetHistoryEntry {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    budgetItems: BudgetItem[];
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyNet: number;
    budgetType: "personal" | "business";
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1943", "#19D7FF"]

const personalCategories = {
    income: ["Salary", "Freelance", "Investments", "Gift", "Other"],
    expense: ["Housing", "Utilities", "Food", "Transportation", "Entertainment", "Healthcare", "Insurance", "Debt Payments", "Savings", "Other"],
};

const businessCategories = {
    income: ["Sales Revenue", "Service Revenue", "Subscriptions", "Interest Earned", "Other Fees", "Total Revenue", "Other Revenue"],
    expense: ["Cost of Goods Sold (COGS)", "Salaries/Wages", "Marketing & Advertising", "Rent/Lease", "Utilities", "Software & Subscriptions", "Supplies", "Repairs & Maintenance", "Insurance", "Professional Fees", "Taxes", "Travel", "Depreciation", "Loan Payments", "Other Operating Costs"],
};

// Helper function to generate dynamic analysis
const generateBudgetAnalysis = (monthlyIncome: number, monthlyNet: number, pieChartData: {name: string, value: number}[], savingsGoals: SavingsGoal[], budgetItems: BudgetItem[]) => {
    const feedback: { type: 'success' | 'warning' | 'info' | 'destructive'; title: string; message: string; icon: React.ReactNode }[] = [];
    const savingsRate = monthlyIncome > 0 ? (monthlyNet / monthlyIncome) * 100 : 0;

    // 1. Net Income / Savings Rate Analysis
    if (monthlyNet < 0) {
        feedback.push({
            type: 'destructive',
            title: 'Spending Alert!',
            message: `You are spending $${Math.abs(monthlyNet).toFixed(2)} more than you earn each month. It's crucial to review your expenses to find areas for reduction.`,
            icon: <AlertCircle className="h-4 w-4" />
        });
    } else if (savingsRate < 10) {
        feedback.push({
            type: 'warning',
            title: 'Low Savings Rate',
            message: `Your current savings rate is ${savingsRate.toFixed(1)}%. While it's great you're in the positive, consider aiming for 10-20% to build a stronger financial future.`,
            icon: <AlertCircle className="h-4 w-4" />
        });
    } else if (savingsRate >= 10 && savingsRate <= 20) {
        feedback.push({
            type: 'success',
            title: 'Good Job!',
            message: `You're saving ${savingsRate.toFixed(1)}% of your income, which is a healthy amount. Keep up the great work!`,
            icon: <ThumbsUp className="h-4 w-4" />
        });
    } else if (savingsRate > 20) {
        feedback.push({
            type: 'success',
            title: 'Excellent Savings Rate!',
            message: `With a savings rate of ${savingsRate.toFixed(1)}%, you are on the fast track to achieving your financial goals. Consider channeling some of these extra funds towards investments.`,
            icon: <Award className="h-4 w-4" />
        });
    }

    // 2. Top Expense Categories Analysis
    if (pieChartData.length > 0) {
        const topExpense = pieChartData.sort((a, b) => b.value - a.value)[0];
        const topExpensePercentage = monthlyIncome > 0 ? (topExpense.value / monthlyIncome) * 100 : 0;
        feedback.push({
            type: 'info',
            title: 'Top Expense Insight',
            message: `Your largest expense category is "${topExpense.name}", making up ${topExpensePercentage.toFixed(1)}% of your total income. Reviewing this category could offer significant savings opportunities.`,
            icon: <Lightbulb className="h-4 w-4" />
        });
    }

    // 3. Debt Payments Analysis
    const debtPaymentItem = budgetItems.find(item => item.category === "Debt Payments");
    if (debtPaymentItem) {
        const monthlyDebtPayment = convertToMonthly(debtPaymentItem.amount, debtPaymentItem.frequency);
        const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyDebtPayment / monthlyIncome) * 100 : 0;
        if (debtToIncomeRatio > 15) {
            feedback.push({
                type: 'warning',
                title: 'High Debt Payments',
                message: `Your debt payments make up ${debtToIncomeRatio.toFixed(1)}% of your income. Consider strategies like the debt snowball or avalanche method to pay this down faster and free up cash flow.`,
                icon: <AlertCircle className="h-4 w-4" />
            });
        }
    }

    // 4. Savings Goals Analysis
    const totalMonthlyContributions = savingsGoals.reduce((acc, goal) => acc + goal.monthlyContribution, 0);
    if (totalMonthlyContributions > 0 && totalMonthlyContributions > monthlyNet) {
        feedback.push({
            type: 'warning',
            title: 'Savings Goals Mismatch',
            message: `Your planned monthly savings contributions ($${totalMonthlyContributions.toFixed(2)}) are higher than your current net income ($${monthlyNet.toFixed(2)}). You may need to adjust your budget or goals to make them achievable.`,
            icon: <AlertCircle className="h-4 w-4" />
        });
    }

    return feedback;
}

export default function BudgetingPage() {
    const [budgetItems, setBudgetItems] = useLocalStorage<BudgetItem[]>("finnacalc-budget-items", [])
    const [savingsGoals, setSavingsGoals] = useLocalStorage<SavingsGoal[]>(
        "finnacalc-savings-goals",
        [],
    )
    const [budgetHistory, setBudgetHistory] = useLocalStorage<BudgetHistoryEntry[]>(
        "finnacalc-budget-history",
        [],
    )
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const [budgetType, setBudgetType] = useState<'personal' | 'business'>('personal');
    const [mounted, setMounted] = useState(false);

    const initialFormState = {
        category: "",
        subcategory: "",
        amount: "",
        frequency: "monthly" as const,
        type: "expense" as const,
        isFixed: false,
    }

    const [newItem, setNewItem] = useState(initialFormState)

    const [newGoal, setNewGoal] = useState({
        name: "",
        targetAmount: "",
        currentAmount: "",
        targetDate: "",
        monthlyContribution: "",
    })

    const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
    const [amountToAdd, setAmountToAdd] = useState("");

    const [isSaveHistoryModalOpen, setIsSaveHistoryModalOpen] = useState(false);
    const [customDate, setCustomDate] = useState<DateRange | undefined>();
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyCustomName, setHistoryCustomName] = useState("");

    const [viewingHistoryEntry, setViewingHistoryEntry] = useState<BudgetHistoryEntry | null>(null);
    const [isHistoryDetailModalOpen, setIsHistoryDetailModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const categories = useMemo(() => {
        return budgetType === 'personal' ? personalCategories : businessCategories;
    }, [budgetType]);

    const convertToMonthly = (amount: number, frequency: string) => {
        const multipliers = { daily: 30, weekly: 4.33, monthly: 1, yearly: 1 / 12 }
        return amount * (multipliers[frequency as keyof typeof multipliers] || 1)
    }

    const monthlyIncome = budgetItems
        .filter((item) => item.type === "income" && item.budgetType === budgetType)
        .reduce((sum, item) => sum + convertToMonthly(item.amount, item.frequency), 0)

    const monthlyExpenses = budgetItems
        .filter((item) => item.type === "expense" && item.budgetType === budgetType)
        .reduce((sum, item) => sum + convertToMonthly(item.amount, item.frequency), 0)

    const monthlyNet = monthlyIncome - monthlyExpenses

    const handleFormSubmit = () => {
        if (editingItemId) {
            setBudgetItems(
                budgetItems.map((item) =>
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
                        : item,
                ),
            )
            setEditingItemId(null)
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
                    budgetType: budgetType,
                }
                setBudgetItems([...budgetItems, itemToAdd])
            }
        }
        setNewItem(initialFormState)
    }

    const handleEditClick = (itemToEdit: BudgetItem) => {
        setEditingItemId(itemToEdit.id)
        setNewItem({
            ...itemToEdit,
            amount: itemToEdit.amount.toString(),
        })
    }

    const handleCancelEdit = () => {
        setEditingItemId(null)
        setNewItem(initialFormState)
    }

    const removeBudgetItem = (id: string, itemName: string) => {
        toast(`Are you sure you want to delete "${itemName}"?`, {
            action: {
                label: "Delete",
                onClick: () => {
                    setBudgetItems(budgetItems.filter((item) => item.id !== id));
                    toast.success(`"${itemName}" has been deleted.`);
                },
            },
            cancel: {
                label: "Cancel",
            },
        });
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
        toast(`Are you sure you want to delete the savings goal "${goalName}"?`, {
            action: {
                label: "Delete",
                onClick: () => {
                    setSavingsGoals(savingsGoals.filter((goal) => goal.id !== id));
                    toast.success(`"${goalName}" has been deleted.`);
                },
            },
            cancel: {
                label: "Cancel",
            },
        });
    }

    const updateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
        setSavingsGoals(savingsGoals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)))
    }

    const handleAddFunds = () => {
        if (selectedGoal && amountToAdd) {
            const newAmount = selectedGoal.currentAmount + Number.parseFloat(amountToAdd);
            updateSavingsGoal(selectedGoal.id, { currentAmount: newAmount });
            setIsAddFundsModalOpen(false);
            setAmountToAdd("");
            setSelectedGoal(null);
        }
    };

    const handleSaveBudgetHistory = () => {
        setHistoryError(null);
        let start: Date | undefined = customDate?.from;
        let end: Date | undefined = customDate?.to;

        if (!start) {
            setHistoryError('Please select a start date.');
            return;
        }
        if (!end) end = start;

        if (start > end) {
            setHistoryError('Start date cannot be after end date.');
            return;
        }

        const duration = differenceInDays(end, start);
        if (duration < 6) {
            setHistoryError('The minimum timeframe is one week.');
            return;
        }
        if (duration > 366) {
            setHistoryError('The maximum timeframe is one year.');
            return;
        }

        const defaultName = `Budget: ${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
        const name = historyCustomName.trim() || defaultName;

        const newHistoryEntry: BudgetHistoryEntry = {
            id: Date.now().toString(),
            name,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            budgetItems: [...filteredBudgetItems],
            monthlyIncome,
            monthlyExpenses,
            monthlyNet,
            budgetType,
        };

        setBudgetHistory([...budgetHistory, newHistoryEntry]);
        setIsSaveHistoryModalOpen(false);
        setHistoryError(null);
        setCustomDate(undefined);
        setHistoryCustomName("");
        toast.success("Budget snapshot saved to history!");
    };

    const [chartView, setChartView] = useState<'expense' | 'income'>('expense');

    const filteredBudgetItems = budgetItems.filter(item => item.budgetType === budgetType);

    const groupedBudgetItems = useMemo(() => {
        return filteredBudgetItems.reduce((acc, item) => {
            acc[item.category] = acc[item.category] || [];
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, BudgetItem[]>);
    }, [filteredBudgetItems]);

    const groupedHistoryItems = useMemo(() => {
        if (!viewingHistoryEntry) return { income: {}, expense: {} };
        return viewingHistoryEntry.budgetItems
            .filter(item => item.budgetType === viewingHistoryEntry.budgetType)
            .reduce((acc, item) => {
                const typeKey = item.type === 'income' ? 'income' : 'expense';
                acc[typeKey] = acc[typeKey] || {};
                acc[typeKey][item.category] = acc[typeKey][item.category] || [];
                acc[typeKey][item.category].push(item);
                return acc;
            }, { income: {}, expense: {} } as { income: Record<string, BudgetItem[]>, expense: Record<string, BudgetItem[]> });
    }, [viewingHistoryEntry]);

    const pieChartData = useMemo(() => {
        const categories = budgetItems
            .filter((item) => item.type === "expense" && item.budgetType === budgetType)
            .reduce((acc, item) => {
                const monthly = convertToMonthly(item.amount, item.frequency);
                acc[item.category] = (acc[item.category] || 0) + monthly;
                return acc;
            }, {} as Record<string, number>);
        return Object.keys(categories).map((key) => ({ name: key, value: categories[key] }));
    }, [budgetItems, budgetType]);

    const incomePieChartData = useMemo(() => {
        const categories = budgetItems
            .filter((item) => item.type === "income" && item.budgetType === budgetType)
            .reduce((acc, item) => {
                const monthly = convertToMonthly(item.amount, item.frequency);
                acc[item.category] = (acc[item.category] || 0) + monthly;
                return acc;
            }, {} as Record<string, number>);
        return Object.keys(categories).map((key) => ({ name: key, value: categories[key] }));
    }, [budgetItems, budgetType]);

    const analysisFeedback = useMemo(() => generateBudgetAnalysis(monthlyIncome, monthlyNet, pieChartData, savingsGoals, filteredBudgetItems), [monthlyIncome, monthlyNet, pieChartData, savingsGoals, filteredBudgetItems]);


    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{budgetType === 'personal' ? 'Personal' : 'Business'} Budget Planner</h1>
                                <p className="text-gray-600">Take control of your finances with our comprehensive budgeting tool</p>
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
                                        <p
                                            className={`text-xl sm:text-2xl font-bold ${monthlyNet >= 0 ? "text-green-600" : "text-red-600"}`}
                                        >
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
                            <TabsTrigger value="budget">Budget</TabsTrigger>
                            <TabsTrigger value="analysis">Analysis</TabsTrigger>
                            <TabsTrigger value="goals">Savings Goals</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>
                        <TabsContent value="budget" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle>{editingItemId ? "Edit Item" : "Add Income or Expense"}</CardTitle>
                                            <div className="flex gap-2">
                                                <Button variant={budgetType === 'personal' ? 'default' : 'outline'} size="sm" onClick={() => setBudgetType('personal')}>Personal</Button>
                                                <Button variant={budgetType === 'business' ? 'default' : 'outline'} size="sm" onClick={() => setBudgetType('business')}>Business</Button>
                                            </div>
                                        </div>
                                        <CardDescription>
                                            {editingItemId ? "Update the details of your item below." : "Track your financial inflows and outflows"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Type</Label>
                                                <Select
                                                    value={newItem.type}
                                                    onValueChange={(value: "income" | "expense") => setNewItem({ ...newItem, type: value, category: "" })}
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
                                                    {categories[newItem.type].map(cat => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
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
                                                {editingItemId ? "Update Item" : "Add to Budget"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>{chartView === 'expense' ? 'Expense Summary' : 'Income Summary'}</CardTitle>
                                                <CardDescription>
                                                    A visual breakdown of your monthly {chartView}s
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant={chartView === 'expense' ? 'default' : 'outline'} size="sm" onClick={() => setChartView('expense')}>Expenses</Button>
                                                <Button variant={chartView === 'income' ? 'default' : 'outline'} size="sm" onClick={() => setChartView('income')}>Income</Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {!mounted ? (
                                            <div className="flex items-center justify-center h-[250px]">
                                                <Skeleton className="h-48 w-48 rounded-full" />
                                            </div>
                                        ) : (
                                            <>
                                                {chartView === 'expense' ? (
                                                    pieChartData.length > 0 ? (
                                                        <div style={{ width: "100%", height: 250 }}>
                                                            <ResponsiveContainer>
                                                                <PieChart>
                                                                    <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
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
                                                    )
                                                ) : (
                                                    incomePieChartData.length > 0 ? (
                                                        <div style={{ width: "100%", height: 250 }}>
                                                            <ResponsiveContainer>
                                                                <PieChart>
                                                                    <Pie data={incomePieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#82ca9d" dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                                        {incomePieChartData.map((entry, index) => (
                                                                            <Cell key={`cell-${index}`} fill={COLORS.slice().reverse()[index % COLORS.length]} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                                                    <Legend />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full min-h-[250px]">
                                                            <p className="text-gray-500 text-sm text-center">Your income summary chart will appear here.</p>
                                                        </div>
                                                    )
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="mt-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div>
                                            <CardTitle>Budget Items ({filteredBudgetItems.length})</CardTitle>
                                            <CardDescription>All your income and expenses for your {budgetType} budget</CardDescription>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsSaveHistoryModalOpen(true)}
                                            className="flex items-center gap-1"
                                        >
                                            <Save className="h-4 w-4" /> Save to History
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                            {Object.keys(groupedBudgetItems).length > 0 ? (
                                                Object.keys(groupedBudgetItems).map(category => (
                                                    <div key={category} className="border-b pb-2 last:border-b-0">
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{category}</h3> {/* Changed to gray-800 */}
                                                        <div className="space-y-2">
                                                            {groupedBudgetItems[category].map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-semibold text-blue-600 truncate">{item.subcategory || "No description"}</p> {/* Changed to blue-600 */}
                                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                                            <span className="capitalize">{item.frequency}</span>
                                                                            {item.isFixed && (
                                                                                <>
                                                                                    <span>&bull;</span>
                                                                                    <Badge variant="secondary" className="text-xs px-2 py-0.5">Fixed</Badge>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <div className="text-right">
                                                            <span
                                                                className={`font-bold ${
                                                                    item.type === "income" ? "text-green-600" : "text-red-600"
                                                                }`}
                                                            >
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
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-center py-8">
                                                    No budget items yet. Add your first income or expense above!
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="analysis" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Budget Analysis & Feedback</CardTitle>
                                    <CardDescription>Get insights and recommendations for your budget</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {filteredBudgetItems.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">Add some income and expenses to see your budget analysis here!</p>
                                    ) : (
                                        <>
                                            {/*}
                                            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                                <AlertTitle className="text-blue-800">Overview</AlertTitle>
                                                <AlertDescription className="text-blue-700">
                                                    Your monthly income is <span className="font-semibold">${monthlyIncome.toFixed(2)}</span> and your monthly expenses are <span className="font-semibold">${monthlyExpenses.toFixed(2)}</span>, resulting in a net of <span className="font-semibold">${monthlyNet.toFixed(2)}</span>.
                                                </AlertDescription>
                                            </Alert>
                                            */}
                                            {analysisFeedback.map((item, index) => {
                                                let variant: 'default' | 'destructive' = 'default';
                                                let customClass = '';
                                                if (item.type === 'destructive') {
                                                    variant = 'destructive';
                                                } else if (item.type === 'warning') {
                                                    customClass = 'bg-yellow-50 border-yellow-200 text-yellow-800';
                                                } else if (item.type === 'success') {
                                                    customClass = 'bg-green-50 border-green-200 text-green-800';
                                                }

                                                return (
                                                    <Alert key={index} variant={variant} className={cn(customClass)}>
                                                        {item.icon}
                                                        <AlertTitle>{item.title}</AlertTitle>
                                                        <AlertDescription>
                                                            {item.message}
                                                        </AlertDescription>
                                                    </Alert>
                                                )
                                            })}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="goals" className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle>Savings Goals</CardTitle>
                                    <Button size="sm" onClick={() => setNewGoal({ ...newGoal, targetDate: format(new Date(), 'yyyy-MM-dd') })} className="flex items-center gap-1">
                                        <PlusCircle className="h-4 w-4" /> Add Goal
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {newGoal.targetDate && ( // Only show form if adding a new goal
                                            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                                                <h4 className="font-semibold text-lg">New Savings Goal</h4>
                                                <div>
                                                    <Label htmlFor="goal-name">Goal Name</Label>
                                                    <Input
                                                        id="goal-name"
                                                        placeholder="e.g., New Car Fund, Down Payment"
                                                        value={newGoal.name}
                                                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="target-amount">Target Amount ($)</Label>
                                                    <Input
                                                        id="target-amount"
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={newGoal.targetAmount}
                                                        onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="current-amount">Current Amount Saved ($)</Label>
                                                    <Input
                                                        id="current-amount"
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={newGoal.currentAmount}
                                                        onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="monthly-contribution">Planned Monthly Contribution ($)</Label>
                                                    <Input
                                                        id="monthly-contribution"
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={newGoal.monthlyContribution}
                                                        onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="target-date">Target Date</Label>
                                                    <Input
                                                        id="target-date"
                                                        type="date"
                                                        value={newGoal.targetDate}
                                                        onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" onClick={() => setNewGoal({ ...newGoal, targetDate: "" })} className="w-full">
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={addSavingsGoal} className="w-full">
                                                        Add Goal
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {savingsGoals.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4">No savings goals yet. Add one to start tracking!</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {savingsGoals.map((goal) => {
                                                    const progress = (goal.currentAmount / goal.targetAmount) * 100
                                                    const remaining = goal.targetAmount - goal.currentAmount
                                                    const daysLeft = differenceInDays(parseISO(goal.targetDate), new Date())
                                                    const monthsLeft = daysLeft > 0 ? Math.ceil(daysLeft / 30.44) : 0;
                                                    const neededPerMonth = monthsLeft > 0 ? remaining / monthsLeft : remaining;

                                                    return (
                                                        <div key={goal.id} className="border p-4 rounded-lg shadow-sm bg-white">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h3 className="text-lg font-semibold">{goal.name}</h3>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedGoal(goal);
                                                                            setIsAddFundsModalOpen(true);
                                                                        }}
                                                                    >
                                                                        Add Funds
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeSavingsGoal(goal.id, goal.name)}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                                <span>Target: ${goal.targetAmount.toFixed(2)}</span>
                                                                <span>Saved: ${goal.currentAmount.toFixed(2)}</span>
                                                            </div>
                                                            <Progress value={progress} className="w-full mb-2" />
                                                            <div className="text-sm text-gray-600 mb-2">
                                                                {progress < 100 ? (
                                                                    <span>
                                                            Remaining: <span className="font-semibold text-red-600">${remaining.toFixed(2)}</span>
                                                        </span>
                                                                ) : (
                                                                    <span className="font-semibold text-green-600">Goal Reached!</span>
                                                                )}
                                                            </div>
                                                            {progress < 100 && (
                                                                <div className="text-xs text-gray-500 space-y-1">
                                                                    {goal.targetDate && daysLeft > 0 && (
                                                                        <p>Target Date: {format(parseISO(goal.targetDate), 'PPP')} ({daysLeft} days left)</p>
                                                                    )}
                                                                    {monthsLeft > 0 && remaining > 0 && (
                                                                        <p>To reach target by date, need to save: <span className="font-semibold">${neededPerMonth.toFixed(2)}/month</span></p>
                                                                    )}
                                                                    {goal.monthlyContribution > 0 && (
                                                                        <p>Your planned monthly contribution: <span className="font-semibold">${goal.monthlyContribution.toFixed(2)}</span></p>
                                                                    )}
                                                                    {goal.monthlyContribution > 0 && neededPerMonth > 0 && goal.monthlyContribution < neededPerMonth && (
                                                                        <Alert variant="destructive">
                                                                            <AlertCircle className="h-4 w-4" />
                                                                            <AlertTitle>Warning</AlertTitle>
                                                                            <AlertDescription>
                                                                                Your planned monthly contribution is less than what's needed to reach your goal by the target date!
                                                                            </AlertDescription>
                                                                        </Alert>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="history" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Budget History</CardTitle>
                                    <CardDescription>Review your past budget snapshots.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {budgetHistory.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No budget history saved yet. Save a snapshot from the "Budget" tab!</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {budgetHistory.map((entry) => (
                                                <div key={entry.id} className="border p-4 rounded-lg shadow-sm bg-white flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">{entry.name}</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {format(parseISO(entry.startDate), 'PPP')} - {format(parseISO(entry.endDate), 'PPP')}
                                                        </p>
                                                        <p className="text-xs text-gray-500 capitalize">{entry.budgetType} Budget</p>
                                                    </div>
                                                    <Button variant="outline" onClick={() => {
                                                        setViewingHistoryEntry(entry);
                                                        setIsHistoryDetailModalOpen(true);
                                                    }}>
                                                        View Details
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Add Funds Modal */}
            <Dialog open={isAddFundsModalOpen} onOpenChange={setIsAddFundsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Funds to {selectedGoal?.name}</DialogTitle>
                        <DialogDescription>
                            Enter the amount you want to add to this savings goal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amountToAdd}
                                onChange={(e) => setAmountToAdd(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddFundsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddFunds}>Add Funds</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Save History Modal */}
            <Dialog open={isSaveHistoryModalOpen} onOpenChange={setIsSaveHistoryModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Save Budget Snapshot</DialogTitle>
                        <DialogDescription>
                            Give your budget snapshot a name and select a date range.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="history-name">Snapshot Name (Optional)</Label>
                            <Input
                                id="history-name"
                                placeholder={`e.g., Budget for ${format(new Date(), 'MMMM yyyy')}`}
                                value={historyCustomName}
                                onChange={(e) => setHistoryCustomName(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Select Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !customDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {customDate?.from ? (
                                            customDate.to ? (
                                                <>
                                                    {format(customDate.from, "LLL dd, y")} -{" "}
                                                    {format(customDate.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(customDate.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={customDate?.from}
                                        selected={customDate}
                                        onSelect={setCustomDate}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            {historyError && <p className="text-red-500 text-sm mt-2">{historyError}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSaveHistoryModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveBudgetHistory}>Save Snapshot</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Detail Modal */}
            <Dialog open={isHistoryDetailModalOpen} onOpenChange={setIsHistoryDetailModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{viewingHistoryEntry?.name}</DialogTitle>
                        <DialogDescription>
                            Details for the budget from {viewingHistoryEntry?.startDate && format(parseISO(viewingHistoryEntry.startDate), 'PPP')} to {viewingHistoryEntry?.endDate && format(parseISO(viewingHistoryEntry.endDate), 'PPP')}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600">Monthly Income</p>
                                    <p className="text-xl font-bold text-green-600">${viewingHistoryEntry?.monthlyIncome.toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600">Monthly Expenses</p>
                                    <p className="text-xl font-bold text-red-600">${viewingHistoryEntry?.monthlyExpenses.toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600">Net Income</p>
                                    <p className={`text-xl font-bold ${viewingHistoryEntry && viewingHistoryEntry.monthlyNet >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        ${viewingHistoryEntry?.monthlyNet.toFixed(2)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <h3 className="text-lg font-semibold border-b pb-2">Income Items</h3>
                        {Object.keys(groupedHistoryItems.income).length > 0 ? (
                            <div className="space-y-3">
                                {Object.keys(groupedHistoryItems.income).map(category => (
                                    <div key={category}>
                                        <h4 className="font-semibold text-gray-800 mb-1">{category}</h4>
                                        <div className="space-y-2">
                                            {groupedHistoryItems.income[category].map(item => (
                                                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                                    <p className="text-blue-600">{item.subcategory || "No description"}</p>
                                                    <span className="font-bold text-green-600">+${item.amount.toFixed(2)} ({item.frequency})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No income items in this snapshot.</p>
                        )}

                        <h3 className="text-lg font-semibold border-b pb-2">Expense Items</h3>
                        {Object.keys(groupedHistoryItems.expense).length > 0 ? (
                            <div className="space-y-3">
                                {Object.keys(groupedHistoryItems.expense).map(category => (
                                    <div key={category}>
                                        <h4 className="font-semibold text-gray-800 mb-1">{category}</h4>
                                        <div className="space-y-2">
                                            {groupedHistoryItems.expense[category].map(item => (
                                                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                                    <p className="text-blue-600">{item.subcategory || "No description"}</p>
                                                    <span className="font-bold text-red-600">-${item.amount.toFixed(2)} ({item.frequency})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No expense items in this snapshot.</p>
                        )}

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsHistoryDetailModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}