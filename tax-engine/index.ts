/**
 * FinnaCalc tax engine — public entry point.
 *
 * A pure, deterministic, year-versioned calculation library with no UI, API,
 * database, clock, or network dependency (tax-engine-specification.md §1). It
 * takes a typed input and a ruleset and returns form-line-addressable results
 * via a fixed-point solver.
 */
export * from "./core/money"
export * from "./core/primitives"
export * from "./core/types"
export { evaluate, MAX_ITERATIONS } from "./core/solver"
export { indexNodes, detectCycles, assertCyclesDeclared } from "./core/graph"
export { FEDERAL_TY2024 } from "./rulesets/federal/ty2024"
export { computeFederalReturn } from "./federal"
export type { FederalReturnInput, FederalReturnResult, FilingStatus } from "./federal"
export {
    computeStateReturn,
    isSupportedState,
    stateName,
    SUPPORTED_STATE_CODES,
} from "./state"
export type { StateReturnInput, StateReturnResult } from "./state"
export { ENGINE_VERSION } from "./version"
