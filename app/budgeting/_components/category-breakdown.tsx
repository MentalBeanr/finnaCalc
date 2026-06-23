"use client"

import * as React from "react"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"
import { formatCurrency, formatPercent } from "@/lib/money/decimal"
import type { BudgetItem, BudgetItemType } from "@/lib/types/budget"
import { aggregateByCategory } from "@/lib/calculations/budget"

interface CategoryBreakdownProps {
    items: ReadonlyArray<BudgetItem>
}

export function CategoryBreakdown({ items }: CategoryBreakdownProps) {
    const [type, setType] = React.useState<BudgetItemType>("expense")
    const aggregates = React.useMemo(
        () => aggregateByCategory(items, type),
        [items, type],
    )

    return (
        <div className="flex flex-col gap-stack-lg p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest h-full">
            <div className="flex items-end justify-between gap-stack-md">
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>Breakdown</Eyebrow>
                    <h3 className="font-headline-md text-headline-md text-primary">
                        Where the money {type === "expense" ? "goes" : "comes from"}
                    </h3>
                </div>
                <div className="inline-flex border border-outline-variant/40 rounded-full p-1">
                    <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={
                            "px-4 py-1.5 font-ui-button text-ui-button uppercase tracking-[0.05em] rounded-full transition-colors " +
                            (type === "expense"
                                ? "bg-primary text-on-primary"
                                : "text-on-surface-variant hover:text-primary")
                        }
                    >
                        Expenses
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("income")}
                        className={
                            "px-4 py-1.5 font-ui-button text-ui-button uppercase tracking-[0.05em] rounded-full transition-colors " +
                            (type === "income"
                                ? "bg-primary text-on-primary"
                                : "text-on-surface-variant hover:text-primary")
                        }
                    >
                        Income
                    </button>
                </div>
            </div>

            {aggregates.length === 0 ? (
                <div className="flex flex-col items-start gap-stack-sm py-stack-xl">
                    <MaterialIcon
                        name={type === "expense" ? "payments" : "trending_up"}
                        size={28}
                        className="text-on-surface-variant"
                    />
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                        No {type} items yet. Add some entries to see the
                        breakdown by category.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-stack-md">
                    {aggregates.map((c) => {
                        const pct = Number(c.percentOfTotal.toString())
                        return (
                            <div key={c.category} className="flex flex-col gap-1.5">
                                <div className="flex items-baseline justify-between">
                                    <span className="font-body-md text-body-md text-on-background">
                                        {c.category}
                                    </span>
                                    <span className="font-body-md text-body-md text-on-background tabular-nums">
                                        {formatCurrency(c.monthlyAmount)}
                                        <span className="text-on-surface-variant ml-2">
                                            {formatPercent(c.percentOfTotal, 1)}
                                        </span>
                                    </span>
                                </div>
                                <div
                                    className="h-1 bg-surface-container rounded-full overflow-hidden"
                                    aria-hidden
                                >
                                    <div
                                        className="h-full bg-primary/70 rounded-full"
                                        style={{
                                            width: `${Math.min(100, pct)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
