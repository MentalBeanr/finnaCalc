"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"
import { convertToMonthly } from "@/lib/calculations/budget"
import { formatCurrency } from "@/lib/money/decimal"
import type { BudgetItem } from "@/lib/types/budget"

interface BudgetItemsListProps {
    items: ReadonlyArray<BudgetItem>
    onEdit: (item: BudgetItem) => void
    onDelete: (id: string) => void
}

export function BudgetItemsList({ items, onEdit, onDelete }: BudgetItemsListProps) {
    const grouped = React.useMemo(() => {
        const map = new Map<string, BudgetItem[]>()
        for (const item of items) {
            const arr = map.get(item.category) ?? []
            arr.push(item)
            map.set(item.category, arr)
        }
        return Array.from(map.entries())
    }, [items])

    return (
        <div className="flex flex-col gap-stack-lg p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest">
            <div className="flex items-end justify-between gap-stack-md border-b border-outline-variant/20 pb-stack-sm">
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>Items</Eyebrow>
                    <h3 className="font-headline-md text-headline-md text-primary">
                        Everything you&apos;ve added ({items.length})
                    </h3>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-start gap-stack-sm py-stack-lg">
                    <MaterialIcon
                        name="add_circle"
                        size={28}
                        className="text-on-surface-variant"
                    />
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                        No items yet. Use the form to add your first income or
                        expense.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-stack-lg">
                    {grouped.map(([category, group]) => (
                        <div key={category} className="flex flex-col gap-stack-md">
                            <h4 className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant">
                                {category}
                            </h4>
                            <ul className="flex flex-col">
                                {group.map((item) => {
                                    const monthly = convertToMonthly(
                                        item.amount,
                                        item.frequency,
                                    )
                                    return (
                                        <li
                                            key={item.id}
                                            className="flex items-center gap-stack-md py-3 border-b border-outline-variant/15 last:border-b-0"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-stack-sm">
                                                    <span className="font-body-md text-body-md text-primary truncate">
                                                        {item.subcategory ||
                                                            item.category}
                                                    </span>
                                                    {item.isFixed ? (
                                                        <span className="font-label-caps text-[10px] uppercase tracking-[0.15em] text-on-surface-variant border border-outline-variant/40 rounded-full px-2 py-0.5">
                                                            Fixed
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <span className="font-body-md text-sm text-on-surface-variant capitalize">
                                                    {item.frequency}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span
                                                    className={
                                                        "font-body-md text-body-md tabular-nums " +
                                                        (item.type === "income"
                                                            ? "text-on-background"
                                                            : "text-on-background")
                                                    }
                                                >
                                                    {item.type === "income" ? "+" : "−"}
                                                    {formatCurrency(item.amount)}
                                                </span>
                                                <span className="font-body-md text-sm text-on-surface-variant tabular-nums">
                                                    {formatCurrency(monthly)}/mo
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 ml-stack-sm">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEdit(item)}
                                                    aria-label="Edit item"
                                                >
                                                    <MaterialIcon
                                                        name="edit"
                                                        size={18}
                                                    />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onDelete(item.id)}
                                                    aria-label="Delete item"
                                                >
                                                    <MaterialIcon
                                                        name="delete"
                                                        size={18}
                                                    />
                                                </Button>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
