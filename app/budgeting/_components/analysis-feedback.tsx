"use client"

import { Eyebrow } from "@/components/ds/eyebrow"
import { MaterialIcon } from "@/components/ds/material-icon"
import type { AnalysisItem } from "@/lib/types/budget"

interface AnalysisFeedbackProps {
    items: ReadonlyArray<AnalysisItem>
}

const toneStyles: Record<AnalysisItem["kind"], { border: string; bg: string; icon: string }> = {
    destructive: {
        border: "border-l-error",
        bg: "bg-error-container/20",
        icon: "text-error",
    },
    warning: {
        border: "border-l-on-surface-variant",
        bg: "bg-surface-container-low",
        icon: "text-on-surface-variant",
    },
    success: {
        border: "border-l-primary",
        bg: "bg-surface-container-low",
        icon: "text-primary",
    },
    info: {
        border: "border-l-outline",
        bg: "bg-surface-container-low",
        icon: "text-on-surface-variant",
    },
}

export function AnalysisFeedback({ items }: AnalysisFeedbackProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-start gap-stack-sm p-10 border border-outline-variant/30 rounded-lg bg-surface-container-lowest">
                <MaterialIcon
                    name="insights"
                    size={28}
                    className="text-on-surface-variant"
                />
                <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
                    Add income and expense items to see analysis here. The more
                    detail, the sharper the recommendations.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-stack-md">
            <Eyebrow>Analysis</Eyebrow>
            <div className="flex flex-col gap-stack-md">
                {items.map((item, idx) => {
                    const tone = toneStyles[item.kind]
                    return (
                        <div
                            key={idx}
                            role="alert"
                            className={`flex items-start gap-stack-md border-l-2 ${tone.border} ${tone.bg} px-6 py-5 rounded-r-lg`}
                        >
                            <MaterialIcon
                                name={item.icon}
                                size={22}
                                className={`${tone.icon} shrink-0 mt-0.5`}
                            />
                            <div className="flex flex-col gap-1">
                                <div className="font-headline-md text-[20px] leading-[1.2] text-primary">
                                    {item.title}
                                </div>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    {item.message}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
