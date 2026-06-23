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
    cycles: [],
}
