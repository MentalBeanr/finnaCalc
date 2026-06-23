/**
 * Integer-cents money primitives.
 *
 * All money in the engine is integer cents (tax-engine-specification.md §3.2).
 * Floats never represent money. Rate application rounds to the nearest cent,
 * which is what makes the fixed-point solver converge exactly (§3.3).
 */

export type Cents = number

/** Basis points: 100% = 10_000 bp, so 24% = 2400 bp. */
export type BasisPoints = number

/** Apply a basis-point rate to a cent amount, rounded to the nearest cent. */
export function applyBp(cents: Cents, bp: BasisPoints): Cents {
    return Math.round((cents * bp) / 10_000)
}

/** Sum any number of cent amounts. */
export function sumCents(...values: Cents[]): Cents {
    return values.reduce((a, b) => a + b, 0)
}

/** Floor a cent amount at zero (taxable income, tax after credits, …). */
export function nonNegative(cents: Cents): Cents {
    return Math.max(0, cents)
}

/** Convert whole/decimal dollars to integer cents. */
export function dollarsToCents(dollars: number): Cents {
    return Math.round(dollars * 100)
}

/** Convert integer cents to a dollars number (display only). */
export function centsToDollars(cents: Cents): number {
    return cents / 100
}
