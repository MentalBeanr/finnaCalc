"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Container } from "@/components/ds/container"
import { Section } from "@/components/ds/section"
import { Eyebrow } from "@/components/ds/eyebrow"
import { SectionHeading } from "@/components/ds/section-heading"
import { Chip } from "@/components/ds/chip"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
    aggregateByCategory,
    calculateBudgetTotals,
    generateAnalysis,
} from "@/lib/calculations/budget"
import type {
    BudgetItem,
    BudgetType,
    SavingsGoal,
} from "@/lib/types/budget"
import {
    AddItemForm,
    INITIAL_ITEM_FORM,
    itemFromForm,
    type ItemFormState,
} from "./_components/add-item-form"
import { AnalysisFeedback } from "./_components/analysis-feedback"
import { BudgetEducation, BudgetFaq } from "./_components/budget-content"
import { BudgetItemsList } from "./_components/budget-items-list"
import { CategoryBreakdown } from "./_components/category-breakdown"
import { SavingsGoalsSection } from "./_components/savings-goals-section"
import { SummaryMetrics } from "./_components/summary-metrics"

export default function BudgetingPage() {
    const [allItems, setAllItems] = useLocalStorage<BudgetItem[]>(
        "finnacalc-budget-items",
        [],
    )
    const [savingsGoals, setSavingsGoals] = useLocalStorage<SavingsGoal[]>(
        "finnacalc-savings-goals",
        [],
    )
    const [budgetType, setBudgetType] = React.useState<BudgetType>("personal")
    const [form, setForm] = React.useState<ItemFormState>(INITIAL_ITEM_FORM)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [formError, setFormError] = React.useState<string | null>(null)

    const items = React.useMemo(
        () => allItems.filter((item) => item.budgetType === budgetType),
        [allItems, budgetType],
    )

    const totals = React.useMemo(() => calculateBudgetTotals(items), [items])
    const expensesByCategory = React.useMemo(
        () => aggregateByCategory(items, "expense"),
        [items],
    )
    const analysis = React.useMemo(
        () =>
            generateAnalysis({
                totals,
                expensesByCategory,
                items,
                savingsGoals,
            }),
        [totals, expensesByCategory, items, savingsGoals],
    )

    const submitItem = () => {
        const next = itemFromForm(form, budgetType, editingId ?? undefined)
        if (!next) {
            setFormError("Pick a category and enter an amount greater than 0.")
            return
        }
        setFormError(null)
        if (editingId) {
            setAllItems(allItems.map((i) => (i.id === editingId ? next : i)))
            setEditingId(null)
        } else {
            setAllItems([...allItems, next])
        }
        setForm(INITIAL_ITEM_FORM)
    }

    const editItem = (item: BudgetItem) => {
        setEditingId(item.id)
        setForm({
            category: item.category,
            subcategory: item.subcategory,
            amount: String(item.amount),
            frequency: item.frequency,
            type: item.type,
            isFixed: item.isFixed,
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setForm(INITIAL_ITEM_FORM)
        setFormError(null)
    }

    const deleteItem = (id: string) => {
        setAllItems(allItems.filter((i) => i.id !== id))
        if (editingId === id) cancelEdit()
    }

    const addGoal = (goal: SavingsGoal) => setSavingsGoals([...savingsGoals, goal])
    const removeGoal = (id: string) =>
        setSavingsGoals(savingsGoals.filter((g) => g.id !== id))
    const addFundsToGoal = (id: string, amount: number) =>
        setSavingsGoals(
            savingsGoals.map((g) =>
                g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g,
            ),
        )

    return (
        <div className="flex flex-col">
            <Section spacing="default" className="pt-section-gap-sm pb-0">
                <Container className="flex flex-col gap-stack-lg">
                    <Eyebrow>Personal Finance</Eyebrow>
                    <h1 className="font-headline-display text-[64px] leading-[1.1] tracking-[-0.02em] text-primary max-w-4xl">
                        Budget Planner
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-prose">
                        Track income and expenses across categories, surface
                        the highest-leverage observations, and set savings
                        goals that the math actually supports.
                    </p>
                    <div className="flex flex-wrap gap-stack-sm pt-stack-sm">
                        <Chip tone="primary">Personal Finance</Chip>
                        <Chip>4 min setup</Chip>
                    </div>
                    <div className="inline-flex border border-outline-variant/40 rounded-full p-1 self-start">
                        <button
                            type="button"
                            onClick={() => setBudgetType("personal")}
                            className={
                                "px-5 py-2 font-ui-button text-ui-button uppercase tracking-[0.05em] rounded-full transition-colors " +
                                (budgetType === "personal"
                                    ? "bg-primary text-on-primary"
                                    : "text-on-surface-variant hover:text-primary")
                            }
                        >
                            Personal
                        </button>
                        <button
                            type="button"
                            onClick={() => setBudgetType("business")}
                            className={
                                "px-5 py-2 font-ui-button text-ui-button uppercase tracking-[0.05em] rounded-full transition-colors " +
                                (budgetType === "business"
                                    ? "bg-primary text-on-primary"
                                    : "text-on-surface-variant hover:text-primary")
                            }
                        >
                            Business
                        </button>
                    </div>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <SummaryMetrics totals={totals} />
                </Container>
            </Section>

            <Section spacing="default" className="pt-0">
                <Container>
                    <Tabs defaultValue="budget">
                        <TabsList>
                            <TabsTrigger value="budget">Budget</TabsTrigger>
                            <TabsTrigger value="analysis">Analysis</TabsTrigger>
                            <TabsTrigger value="goals">Savings Goals</TabsTrigger>
                        </TabsList>

                        <TabsContent value="budget" className="pt-stack-lg">
                            <div className="flex flex-col gap-stack-lg">
                                <div className="grid grid-cols-12 gap-gutter">
                                    <div className="col-span-7">
                                        <AddItemForm
                                            value={form}
                                            onChange={setForm}
                                            onSubmit={submitItem}
                                            onCancel={editingId ? cancelEdit : undefined}
                                            budgetType={budgetType}
                                            editing={editingId !== null}
                                            error={formError ?? undefined}
                                        />
                                    </div>
                                    <div className="col-span-5">
                                        <CategoryBreakdown items={items} />
                                    </div>
                                </div>
                                <BudgetItemsList
                                    items={items}
                                    onEdit={editItem}
                                    onDelete={deleteItem}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="analysis" className="pt-stack-lg">
                            <AnalysisFeedback items={analysis} />
                        </TabsContent>

                        <TabsContent value="goals" className="pt-stack-lg">
                            <SavingsGoalsSection
                                goals={savingsGoals}
                                onAdd={addGoal}
                                onRemove={removeGoal}
                                onAddFunds={addFundsToGoal}
                            />
                        </TabsContent>
                    </Tabs>
                </Container>
            </Section>

            <Section spacing="default">
                <Container className="flex flex-col gap-stack-lg">
                    <SectionHeading
                        eyebrow="Background"
                        title="How to read a budget"
                    />
                    <div className="pt-stack-md font-body-md text-body-md text-on-surface-variant max-w-3xl flex flex-col gap-stack-md">
                        <BudgetEducation />
                    </div>
                </Container>
            </Section>

            <Section spacing="default">
                <Container>
                    <BudgetFaq />
                </Container>
            </Section>
        </div>
    )
}
