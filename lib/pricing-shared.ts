/**
 * Client-safe pricing (the revenue model, tax-platform-architecture-v2.md §13).
 *
 * Federal filing is free (the trust/funnel tier). State filing is a paid add-on,
 * priced at $0 until state filing is actually delivered (roadmap #11) — we do not
 * charge for what we cannot yet file. Pure and testable; money in integer cents.
 */

export const FEDERAL_FILING_FEE_CENTS = 0

/** Per-state filing fee. $0 until state e-file ships (roadmap #11). */
export const STATE_FILING_FEE_CENTS = 0

export interface PriceLineItem {
    label: string
    amountCents: number
}

export interface ReturnPricing {
    items: PriceLineItem[]
    totalCents: number
}

export function priceReturn(opts: { stateFilings?: number } = {}): ReturnPricing {
    const items: PriceLineItem[] = [
        { label: "Federal filing", amountCents: FEDERAL_FILING_FEE_CENTS },
    ]
    const states = Math.max(0, Math.round(opts.stateFilings ?? 0))
    if (states > 0) {
        items.push({
            label: states === 1 ? "State filing" : `State filing × ${states}`,
            amountCents: STATE_FILING_FEE_CENTS * states,
        })
    }
    const totalCents = items.reduce((sum, item) => sum + item.amountCents, 0)
    return { items, totalCents }
}
