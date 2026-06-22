"use client"

import * as React from "react"
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

export interface DataChartPoint {
    x: number | string
    y: number
}

interface DataChartProps {
    data: ReadonlyArray<DataChartPoint>
    formatY?: (value: number) => string
    formatX?: (value: number | string) => string
    height?: number
    showAxes?: boolean
    showGrid?: boolean
    showTooltip?: boolean
    ariaLabel?: string
}

const NAVY = "#00061a"
const OUTLINE_VARIANT = "#c5c6cf"
const SURFACE_VARIANT = "#45464e"

const defaultFormatY = (n: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(n)

export function DataChart({
    data,
    formatY = defaultFormatY,
    formatX,
    height = 240,
    showAxes = true,
    showGrid = true,
    showTooltip = true,
    ariaLabel,
}: DataChartProps) {
    return (
        <div className="w-full" style={{ height }} aria-label={ariaLabel} role="img">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data as DataChartPoint[]}
                    margin={{ top: 8, right: 8, left: showAxes ? 8 : 0, bottom: 0 }}
                >
                    {showGrid ? (
                        <CartesianGrid
                            stroke={OUTLINE_VARIANT}
                            strokeOpacity={0.35}
                            strokeDasharray="0"
                            vertical={false}
                        />
                    ) : null}
                    {showAxes ? (
                        <>
                            <XAxis
                                dataKey="x"
                                stroke={OUTLINE_VARIANT}
                                tick={{ fill: SURFACE_VARIANT, fontSize: 11, fontFamily: "Hanken Grotesk" }}
                                tickLine={false}
                                axisLine={{ stroke: OUTLINE_VARIANT, strokeOpacity: 0.4 }}
                                tickFormatter={formatX}
                            />
                            <YAxis
                                stroke={OUTLINE_VARIANT}
                                tick={{ fill: SURFACE_VARIANT, fontSize: 11, fontFamily: "Hanken Grotesk" }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatY}
                                width={64}
                            />
                        </>
                    ) : null}
                    {showTooltip ? (
                        <Tooltip
                            contentStyle={{
                                background: "#ffffff",
                                border: `1px solid ${OUTLINE_VARIANT}`,
                                borderRadius: 4,
                                fontFamily: "Hanken Grotesk",
                                fontSize: 12,
                                color: NAVY,
                                padding: "8px 12px",
                            }}
                            labelStyle={{ color: SURFACE_VARIANT, marginBottom: 4 }}
                            formatter={(value: number) => [formatY(value), ""]}
                            separator=""
                            cursor={{ stroke: OUTLINE_VARIANT, strokeOpacity: 0.6, strokeWidth: 1 }}
                        />
                    ) : null}
                    <Line
                        type="monotone"
                        dataKey="y"
                        stroke={NAVY}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3, fill: NAVY, stroke: NAVY }}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
