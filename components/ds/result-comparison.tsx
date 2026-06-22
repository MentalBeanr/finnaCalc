import * as React from "react"
import { cn } from "@/lib/utils"
import { Eyebrow } from "@/components/ds/eyebrow"

export interface ComparisonBreakdownRow {
    label: string
    value: string
    muted?: boolean
    divider?: boolean
    emphasize?: boolean
}

export interface ComparisonSide {
    eyebrow?: string
    label: string
    /** The headline metric for this side. */
    primary: { label: string; value: string; sublabel?: string }
    /** Optional line-by-line breakdown displayed below the primary metric. */
    breakdown?: ReadonlyArray<ComparisonBreakdownRow>
    /** When true, this side is rendered with a subtle highlight to denote the winner. */
    winner?: boolean
}

interface ResultComparisonProps {
    left: ComparisonSide
    right: ComparisonSide
    /** Optional verdict block rendered above the comparison. */
    verdict?: {
        eyebrow?: string
        title: string
        body?: React.ReactNode
    }
    className?: string
}

export function ResultComparison({
    left,
    right,
    verdict,
    className,
}: ResultComparisonProps) {
    return (
        <div className={cn("flex flex-col gap-stack-lg p-10 h-full", className)}>
            {verdict ? (
                <div className="flex flex-col gap-stack-sm">
                    <Eyebrow>{verdict.eyebrow ?? "Verdict"}</Eyebrow>
                    <div className="font-headline-display text-[44px] leading-[1.1] tracking-[-0.02em] text-primary">
                        {verdict.title}
                    </div>
                    {verdict.body ? (
                        <div className="font-body-md text-body-md text-on-surface-variant">
                            {verdict.body}
                        </div>
                    ) : null}
                </div>
            ) : null}
            <div className="grid grid-cols-2 gap-gutter border-t border-outline-variant/30 pt-stack-lg">
                <Side data={left} side="left" />
                <Side data={right} side="right" />
            </div>
        </div>
    )
}

function Side({
    data,
    side,
}: {
    data: ComparisonSide
    side: "left" | "right"
}) {
    return (
        <div
            className={cn(
                "flex flex-col gap-stack-md",
                side === "right" && "border-l border-outline-variant/20 pl-gutter -ml-px",
                data.winner && "relative",
            )}
        >
            <div className="flex flex-col gap-1">
                {data.eyebrow ? (
                    <Eyebrow tone={data.winner ? "primary" : "default"}>
                        {data.eyebrow}
                    </Eyebrow>
                ) : null}
                <div className="font-headline-md text-headline-md text-primary">
                    {data.label}
                </div>
            </div>
            <div className="flex flex-col gap-stack-sm">
                <Eyebrow>{data.primary.label}</Eyebrow>
                <div className="font-headline-display text-[32px] leading-[1.1] tracking-[-0.02em] text-primary tabular-nums break-words">
                    {data.primary.value}
                </div>
                {data.primary.sublabel ? (
                    <div className="font-body-md text-body-md text-on-surface-variant">
                        {data.primary.sublabel}
                    </div>
                ) : null}
            </div>
            {data.breakdown && data.breakdown.length > 0 ? (
                <dl className="flex flex-col pt-stack-sm border-t border-outline-variant/20">
                    {data.breakdown.map((row, idx) => (
                        <div
                            key={`${row.label}-${idx}`}
                            className={cn(
                                "flex justify-between items-baseline py-2",
                                row.divider && "border-t border-outline-variant/15 mt-1 pt-3",
                            )}
                        >
                            <dt
                                className={cn(
                                    "font-body-md text-body-md",
                                    row.emphasize
                                        ? "text-primary"
                                        : "text-on-surface-variant",
                                )}
                            >
                                {row.label}
                            </dt>
                            <dd
                                className={cn(
                                    "font-body-md text-body-md tabular-nums",
                                    row.emphasize
                                        ? "text-primary"
                                        : row.muted
                                            ? "text-on-surface-variant"
                                            : "text-on-background",
                                )}
                            >
                                {row.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            ) : null}
        </div>
    )
}
