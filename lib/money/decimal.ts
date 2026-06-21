import Decimal from "decimal.js"

Decimal.set({
    precision: 40,
    rounding: Decimal.ROUND_HALF_EVEN,
    toExpNeg: -9,
    toExpPos: 40,
})

export { Decimal }

export type DecimalInput = Decimal | number | string

export const ZERO = new Decimal(0)
export const ONE = new Decimal(1)

export function D(value: DecimalInput): Decimal {
    return value instanceof Decimal ? value : new Decimal(value)
}

export function parseAmount(input: string): Decimal | null {
    if (typeof input !== "string") return null
    const trimmed = input.trim()
    if (trimmed === "") return null
    const cleaned = trimmed.replace(/[$,\s]/g, "")
    if (!/^-?\d*\.?\d+$/.test(cleaned)) return null
    try {
        return new Decimal(cleaned)
    } catch {
        return null
    }
}

export interface FormatCurrencyOptions {
    currency?: string
    locale?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
}

export function formatCurrency(
    value: DecimalInput,
    options: FormatCurrencyOptions = {},
): string {
    const {
        currency = "USD",
        locale = "en-US",
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
    } = options
    const rounded = D(value).toDecimalPlaces(maximumFractionDigits, Decimal.ROUND_HALF_EVEN)
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(rounded.toNumber())
}

export function formatPercent(
    value: DecimalInput,
    fractionDigits = 2,
    locale = "en-US",
): string {
    const rounded = D(value).toDecimalPlaces(fractionDigits, Decimal.ROUND_HALF_EVEN)
    return `${new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(rounded.toNumber())}%`
}

export function formatNumber(
    value: DecimalInput,
    fractionDigits = 0,
    locale = "en-US",
): string {
    const rounded = D(value).toDecimalPlaces(fractionDigits, Decimal.ROUND_HALF_EVEN)
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(rounded.toNumber())
}

export function isPositive(value: DecimalInput): boolean {
    return D(value).gt(0)
}

export function isNonNegative(value: DecimalInput): boolean {
    return D(value).gte(0)
}
