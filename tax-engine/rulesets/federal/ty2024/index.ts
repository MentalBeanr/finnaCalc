/**
 * Federal TY2024 ruleset (tax-engine-specification.md §2.6).
 *
 * Immutable, year-versioned. The current graph is acyclic (its cycle inventory
 * is empty); the engine's fixed-point solver handles cycles generally, proven by
 * the dedicated cycle fixtures in the engine tests.
 */
import type { Ruleset } from "@/tax-engine/core/types"
import { FEDERAL_TY2024_NODES } from "./nodes"

export const FEDERAL_TY2024: Ruleset = {
    id: "federal:ty2024",
    jurisdiction: "federal",
    taxYear: 2024,
    nodes: FEDERAL_TY2024_NODES,
    // Sch1.L21 (student loan interest deduction) depends on F1040.L11 (AGI)
    // for its phase-out, and F1040.L11 subtracts Sch1.L21 — a genuine cycle
    // resolved by the fixed-point solver.
    cycles: [["Sch1.L21", "F1040.L11"]],
}
