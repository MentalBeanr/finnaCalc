"use client"

import * as React from "react"
import { DataChart, type DataChartPoint } from "@/components/ds/data-chart"
import { Chip } from "@/components/ds/chip"

const INITIAL = 10_000
const ANNUAL_RATE = 0.07
const YEARS = 30

function compoundGrowth(): DataChartPoint[] {
    const points: DataChartPoint[] = []
    for (let year = 0; year <= YEARS; year++) {
        const value = INITIAL * Math.pow(1 + ANNUAL_RATE, year)
        points.push({ x: year, y: Math.round(value) })
    }
    return points
}

const CURRENCY = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
})

const COMPACT_CURRENCY = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
})

export function HeroGrowthChart() {
    const data = React.useMemo(() => compoundGrowth(), [])
    const final = data[data.length - 1].y
    const totalReturnPct = ((final - INITIAL) / INITIAL) * 100

    return (
        <div className="flex flex-col gap-stack-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 h-full">
            <div className="flex items-start justify-between gap-stack-md">
                <div className="flex flex-col gap-1">
                    <span className="font-ui-button text-ui-button uppercase tracking-[0.05em] text-on-surface-variant">
                        Compound Growth · 7% Annual
                    </span>
                    <div className="font-headline-md text-headline-md text-primary">
                        {CURRENCY.format(final)}
                    </div>
                    <span className="font-body-md text-sm text-on-surface-variant">
                        From {CURRENCY.format(INITIAL)} over {YEARS} years
                    </span>
                </div>
                <Chip tone="primary">+{totalReturnPct.toFixed(0)}%</Chip>
            </div>
            <div className="flex-grow min-h-[180px]">
                <DataChart
                    data={data}
                    height={220}
                    formatX={(value) => `Y${value}`}
                    formatY={(value) => COMPACT_CURRENCY.format(value)}
                    ariaLabel={`Compound growth chart showing ${CURRENCY.format(INITIAL)} growing to ${CURRENCY.format(final)} over ${YEARS} years at 7% annual return`}
                />
            </div>
        </div>
    )
}
