"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ds/form-field"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"
import { formatCurrency, formatPercent } from "@/lib/money/decimal"
import { D } from "@/lib/money/decimal"
import type { SavingsGoal } from "@/lib/types/budget"

interface SavingsGoalsSectionProps {
    goals: ReadonlyArray<SavingsGoal>
    onAdd: (goal: SavingsGoal) => void
    onRemove: (id: string) => void
    onAddFunds: (id: string, amount: number) => void
}

interface GoalFormState {
    name: string
    targetAmount: string
    currentAmount: string
    targetDate: string
    monthlyContribution: string
}

const INITIAL_GOAL_FORM: GoalFormState = {
    name: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    monthlyContribution: "0",
}

export function SavingsGoalsSection({
    goals,
    onAdd,
    onRemove,
    onAddFunds,
}: SavingsGoalsSectionProps) {
    const [showForm, setShowForm] = React.useState(false)
    const [form, setForm] = React.useState<GoalFormState>(INITIAL_GOAL_FORM)
    const [error, setError] = React.useState<string | null>(null)
    const [fundsByGoal, setFundsByGoal] = React.useState<Record<string, string>>({})

    const submitGoal = () => {
        const target = parseFloat(form.targetAmount)
        if (!form.name || !Number.isFinite(target) || target <= 0) {
            setError("Enter a name and a target amount greater than 0.")
            return
        }
        const current = parseFloat(form.currentAmount) || 0
        const contrib = parseFloat(form.monthlyContribution) || 0
        onAdd({
            id: Date.now().toString(),
            name: form.name,
            targetAmount: target,
            currentAmount: current,
            targetDate: form.targetDate || new Date().toISOString().slice(0, 10),
            monthlyContribution: contrib,
        })
        setForm(INITIAL_GOAL_FORM)
        setShowForm(false)
        setError(null)
    }

    return (
        <div className="flex flex-col gap-stack-lg">
            <div className="flex items-end justify-between gap-stack-md border-b border-outline-variant/20 pb-stack-sm">
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>Savings Goals</Eyebrow>
                    <h2 className="font-headline-lg text-headline-lg text-primary">
                        What you&apos;re working toward
                    </h2>
                </div>
                <Button
                    variant={showForm ? "outline" : "default"}
                    onClick={() => setShowForm((s) => !s)}
                >
                    <MaterialIcon name={showForm ? "close" : "add"} size={16} />
                    {showForm ? "Cancel" : "Add Goal"}
                </Button>
            </div>

            {showForm ? (
                <div className="flex flex-col gap-stack-lg p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest">
                    <div className="grid grid-cols-2 gap-stack-lg">
                        <FormField
                            id="goal-name"
                            label="Goal Name"
                            value={form.name}
                            onChange={(v) => setForm({ ...form, name: v })}
                            placeholder="e.g. House down payment"
                            type="text"
                            inputMode="text"
                            className="col-span-2"
                        />
                        <FormField
                            id="goal-target"
                            label="Target Amount ($)"
                            value={form.targetAmount}
                            onChange={(v) => setForm({ ...form, targetAmount: v })}
                            placeholder="50000"
                            error={error ?? undefined}
                        />
                        <FormField
                            id="goal-current"
                            label="Already Saved ($)"
                            value={form.currentAmount}
                            onChange={(v) => setForm({ ...form, currentAmount: v })}
                            placeholder="5000"
                        />
                        <FormField
                            id="goal-contrib"
                            label="Monthly Contribution ($)"
                            value={form.monthlyContribution}
                            onChange={(v) =>
                                setForm({ ...form, monthlyContribution: v })
                            }
                            placeholder="500"
                        />
                        <FormField
                            id="goal-date"
                            label="Target Date"
                            value={form.targetDate}
                            onChange={(v) => setForm({ ...form, targetDate: v })}
                            type="date"
                            inputMode="text"
                            placeholder=""
                        />
                    </div>
                    <Button onClick={submitGoal} size="lg">
                        Save Goal
                    </Button>
                </div>
            ) : null}

            {goals.length === 0 ? (
                <div className="flex flex-col items-start gap-stack-sm p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest">
                    <MaterialIcon
                        name="savings"
                        size={28}
                        className="text-on-surface-variant"
                    />
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                        No goals yet. Add one to track progress toward what
                        you&apos;re saving for.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-stack-md">
                    {goals.map((goal) => {
                        const target = D(goal.targetAmount)
                        const current = D(goal.currentAmount)
                        const remaining = target.minus(current)
                        const progressDec = target.gt(0)
                            ? current.div(target).times(100)
                            : D(0)
                        const progressPct = Math.min(
                            100,
                            Math.max(0, Number(progressDec.toString())),
                        )
                        const isComplete = progressPct >= 100

                        return (
                            <div
                                key={goal.id}
                                className="flex flex-col gap-stack-md p-8 border border-outline-variant/30 rounded-lg bg-surface-container-lowest"
                            >
                                <div className="flex items-start justify-between gap-stack-md">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-headline-md text-[22px] leading-[1.2] text-primary">
                                            {goal.name}
                                        </span>
                                        <span className="font-body-md text-sm text-on-surface-variant">
                                            {formatCurrency(current)} of{" "}
                                            {formatCurrency(target)} ·{" "}
                                            {formatPercent(progressDec, 1)} complete
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onRemove(goal.id)}
                                        aria-label="Delete goal"
                                    >
                                        <MaterialIcon name="delete" size={18} />
                                    </Button>
                                </div>

                                <div
                                    className="h-2 bg-surface-container rounded-full overflow-hidden"
                                    aria-hidden
                                >
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>

                                {!isComplete ? (
                                    <div className="flex items-end gap-stack-md">
                                        <FormField
                                            id={`fund-${goal.id}`}
                                            label="Add Funds ($)"
                                            value={fundsByGoal[goal.id] ?? ""}
                                            onChange={(v) =>
                                                setFundsByGoal({
                                                    ...fundsByGoal,
                                                    [goal.id]: v,
                                                })
                                            }
                                            placeholder="100"
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const amt = parseFloat(
                                                    fundsByGoal[goal.id] ?? "",
                                                )
                                                if (Number.isFinite(amt) && amt > 0) {
                                                    onAddFunds(goal.id, amt)
                                                    setFundsByGoal({
                                                        ...fundsByGoal,
                                                        [goal.id]: "",
                                                    })
                                                }
                                            }}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-stack-sm">
                                        <MaterialIcon
                                            name="verified"
                                            size={18}
                                            className="text-primary"
                                        />
                                        <span className="font-body-md text-body-md text-primary">
                                            Goal reached.
                                        </span>
                                    </div>
                                )}

                                {!isComplete ? (
                                    <div className="flex flex-col gap-1 pt-stack-sm border-t border-outline-variant/15">
                                        <span className="font-body-md text-sm text-on-surface-variant">
                                            Remaining: {formatCurrency(remaining)}
                                        </span>
                                        {goal.monthlyContribution > 0 ? (
                                            <span className="font-body-md text-sm text-on-surface-variant">
                                                Contribution:{" "}
                                                {formatCurrency(goal.monthlyContribution)}/mo
                                            </span>
                                        ) : null}
                                        {goal.targetDate ? (
                                            <span className="font-body-md text-sm text-on-surface-variant">
                                                Target date: {goal.targetDate}
                                            </span>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
