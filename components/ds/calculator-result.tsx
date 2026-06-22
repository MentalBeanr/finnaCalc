import * as React from "react"
import { cn } from "@/lib/utils"
import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"

interface ResultPrimaryProps {
    label: string
    value: string
    sublabel?: string
    className?: string
}

export function ResultPrimary({ label, value, sublabel, className }: ResultPrimaryProps) {
    return (
        <div className={cn("flex flex-col gap-stack-sm", className)}>
            <Eyebrow>{label}</Eyebrow>
            <div className="font-headline-display text-[56px] leading-[1.05] tracking-[-0.02em] text-primary tabular-nums break-words">
                {value}
            </div>
            {sublabel ? (
                <div className="font-body-md text-body-md text-on-surface-variant">
                    {sublabel}
                </div>
            ) : null}
        </div>
    )
}

interface ResultMetricProps {
    label: string
    value: string
    className?: string
}

export function ResultMetric({ label, value, className }: ResultMetricProps) {
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <div className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-on-surface-variant">
                {label}
            </div>
            <div className="font-body-lg text-body-lg text-primary tabular-nums">{value}</div>
        </div>
    )
}

interface ResultMetricsGridProps {
    children: React.ReactNode
    columns?: 2 | 3
    className?: string
}

export function ResultMetricsGrid({
    children,
    columns = 2,
    className,
}: ResultMetricsGridProps) {
    return (
        <div
            className={cn(
                "grid gap-stack-lg pt-stack-md border-t border-outline-variant/30",
                columns === 2 ? "grid-cols-2" : "grid-cols-3",
                className,
            )}
        >
            {children}
        </div>
    )
}

interface ResultPanelProps {
    children: React.ReactNode
    className?: string
}

export function ResultPanel({ children, className }: ResultPanelProps) {
    return (
        <div className={cn("flex flex-col gap-stack-lg p-10 h-full", className)}>
            {children}
        </div>
    )
}

interface ResultEmptyStateProps {
    title?: string
    description?: string
    icon?: string
}

export function ResultEmptyState({
    title = "Enter values to calculate",
    description = "Your result will appear here.",
    icon = "calculate",
}: ResultEmptyStateProps) {
    return (
        <div className="flex flex-col gap-stack-md p-10 h-full items-start justify-center">
            <MaterialIcon name={icon} size={32} className="text-on-surface-variant" />
            <div className="font-headline-md text-[24px] leading-[1.3] text-on-surface-variant">
                {title}
            </div>
            <div className="font-body-md text-body-md text-on-surface-variant/80 max-w-prose">
                {description}
            </div>
        </div>
    )
}

interface FormErrorBannerProps {
    message: string
}

export function FormErrorBanner({ message }: FormErrorBannerProps) {
    return (
        <div
            role="alert"
            className="flex items-start gap-stack-md border-l-2 border-error bg-error-container/30 px-4 py-3 rounded-r"
        >
            <MaterialIcon
                name="error"
                size={20}
                className="text-error shrink-0 mt-0.5"
            />
            <p className="font-body-md text-body-md text-on-error-container">{message}</p>
        </div>
    )
}
