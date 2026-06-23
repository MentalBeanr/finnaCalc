/**
 * Rule primitives (tax-engine-specification.md §2.4).
 *
 * The small, audited set of building blocks rule formulas compose from, so
 * bracket math (etc.) is implemented once. All money is integer cents.
 */
import { applyBp, type BasisPoints, type Cents, nonNegative } from "./money"

export interface Bracket {
    /** Lower bound of the bracket, in cents. */
    lowerCents: Cents
    rateBp: BasisPoints
}

/** Progressive tax over an ascending bracket table. */
export function bracketTax(taxableCents: Cents, brackets: Bracket[]): Cents {
    let tax = 0
    for (let i = 0; i < brackets.length; i++) {
        const lower = brackets[i].lowerCents
        if (taxableCents <= lower) break
        const upper = i + 1 < brackets.length ? brackets[i + 1].lowerCents : Number.POSITIVE_INFINITY
        const amountInBracket = Math.min(taxableCents, upper) - lower
        tax += applyBp(amountInBracket, brackets[i].rateBp)
    }
    return tax
}

/** The marginal rate (bp) that applies at a given taxable income. */
export function marginalRateBp(taxableCents: Cents, brackets: Bracket[]): BasisPoints {
    let rate = brackets.length > 0 ? brackets[0].rateBp : 0
    for (const b of brackets) {
        if (taxableCents > b.lowerCents) rate = b.rateBp
    }
    return rate
}

/** Excess of an amount over a floor (e.g. medical over 7.5% AGI). */
export function applyFloorExcess(amountCents: Cents, floorCents: Cents): Cents {
    return nonNegative(amountCents - floorCents)
}

/** Cap an amount at a ceiling (e.g. SALT $10k). */
export function cap(amountCents: Cents, ceilingCents: Cents): Cents {
    return Math.min(amountCents, ceilingCents)
}

/** The larger of two amounts (e.g. standard vs. itemized). */
export function chooseMax(a: Cents, b: Cents): Cents {
    return Math.max(a, b)
}

/**
 * Linear phase-out: reduce `value` to zero as `measure` moves from `start` to
 * `end`. Below `start`, full value; at/above `end`, zero.
 */
export function interpolatePhaseout(
    value: Cents,
    measureCents: Cents,
    startCents: Cents,
    endCents: Cents,
): Cents {
    if (measureCents <= startCents) return value
    if (measureCents >= endCents || endCents <= startCents) return 0
    const remaining = (endCents - measureCents) / (endCents - startCents)
    return Math.round(value * remaining)
}
