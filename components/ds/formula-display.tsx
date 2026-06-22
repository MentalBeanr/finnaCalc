import * as React from "react"
import { cn } from "@/lib/utils"

interface FormulaDisplayProps {
    children: React.ReactNode
    caption?: string
    className?: string
}

export function FormulaDisplay({ children, caption, className }: FormulaDisplayProps) {
    return (
        <figure
            className={cn(
                "flex flex-col items-center gap-stack-md border border-outline-variant/30 bg-surface-container-low rounded-lg px-10 py-10",
                className,
            )}
        >
            <div className="font-serif text-[28px] leading-[1.4] text-primary text-center tabular-nums">
                {children}
            </div>
            {caption ? (
                <figcaption className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant text-center max-w-prose">
                    {caption}
                </figcaption>
            ) : null}
        </figure>
    )
}

interface FormulaLegendProps {
    items: ReadonlyArray<{ symbol: string; description: string }>
    className?: string
}

export function FormulaLegend({ items, className }: FormulaLegendProps) {
    return (
        <dl
            className={cn(
                "grid grid-cols-2 gap-x-gutter gap-y-stack-md",
                className,
            )}
        >
            {items.map((item) => (
                <div key={item.symbol} className="flex gap-stack-md items-baseline">
                    <dt className="font-serif text-[22px] text-primary leading-none w-8 shrink-0">
                        {item.symbol}
                    </dt>
                    <dd className="font-body-md text-body-md text-on-surface-variant">
                        {item.description}
                    </dd>
                </div>
            ))}
        </dl>
    )
}
