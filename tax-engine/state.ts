/**
 * State tax support (tax-engine-specification.md §6).
 *
 * States are additional rulesets composed onto the federal result, reusing the
 * same node model and solver. The foundational set covers resident-only,
 * flat-rate states that start from a federal figure; bracketed states, part-year,
 * and nonresident returns (and the inter-state credit coupling) are deferred.
 */
import { applyBp } from "./core/money"
import { evaluate } from "./core/solver"
import type { Ruleset } from "./core/types"

/** Colorado: 4.4% of federal taxable income (resident, simplified). */
const COLORADO_TY2024: Ruleset = {
    id: "state:CO:ty2024",
    jurisdiction: "state:CO",
    taxYear: 2024,
    nodes: [
        { id: "fed.taxableIncome", kind: "input", dataType: "money", dependsOn: [] },
        {
            id: "STATE.tax",
            kind: "computed",
            dataType: "money",
            dependsOn: ["fed.taxableIncome"],
            formula: (r) => applyBp(r("fed.taxableIncome"), 440),
            citation: "Colorado flat income tax (4.4%)",
        },
    ],
    cycles: [],
}

/** Illinois: 4.95% of base income (≈ federal AGI, resident, simplified). */
const ILLINOIS_TY2024: Ruleset = {
    id: "state:IL:ty2024",
    jurisdiction: "state:IL",
    taxYear: 2024,
    nodes: [
        { id: "fed.agi", kind: "input", dataType: "money", dependsOn: [] },
        {
            id: "STATE.tax",
            kind: "computed",
            dataType: "money",
            dependsOn: ["fed.agi"],
            formula: (r) => applyBp(r("fed.agi"), 495),
            citation: "Illinois flat income tax (4.95%)",
        },
    ],
    cycles: [],
}

interface StateConfig {
    name: string
    ruleset: Ruleset
    /** Which federal figure seeds the state computation. */
    basis: "agi" | "taxableIncome"
}

const SUPPORTED_STATES: Record<string, StateConfig> = {
    CO: { name: "Colorado", ruleset: COLORADO_TY2024, basis: "taxableIncome" },
    IL: { name: "Illinois", ruleset: ILLINOIS_TY2024, basis: "agi" },
}

export const SUPPORTED_STATE_CODES = Object.keys(SUPPORTED_STATES)

export function isSupportedState(code: string | null | undefined): boolean {
    return Boolean(code && code in SUPPORTED_STATES)
}

export function stateName(code: string): string {
    return SUPPORTED_STATES[code]?.name ?? code
}

export interface StateReturnInput {
    stateCode: string
    agiCents: number
    taxableIncomeCents: number
}

export interface StateReturnResult {
    stateCode: string
    stateName: string
    stateTaxCents: number
    converged: boolean
}

/** Compute a resident state return from the federal figures, or null if unsupported. */
export function computeStateReturn(input: StateReturnInput): StateReturnResult | null {
    const config = SUPPORTED_STATES[input.stateCode]
    if (!config) return null

    const seed: Record<string, number> =
        config.basis === "agi"
            ? { "fed.agi": input.agiCents }
            : { "fed.taxableIncome": input.taxableIncomeCents }
    const result = evaluate({ taxYear: 2024, values: seed }, config.ruleset)

    return {
        stateCode: input.stateCode,
        stateName: config.name,
        stateTaxCents: result.values["STATE.tax"] ?? 0,
        converged: result.converged,
    }
}
