/**
 * Dependency graph construction and validation (tax-engine-specification.md §2,
 * §3.4).
 *
 * Builds a node index, validates that all declared dependencies exist, and
 * checks that every genuine cycle in the graph is in the ruleset's declared
 * cycle inventory — so an accidental circular dependency introduced by a bad
 * formula fails loudly rather than silently iterating.
 */
import type { NodeId, RuleNode, Ruleset } from "./types"

export type NodeIndex = Map<NodeId, RuleNode>

export function indexNodes(ruleset: Ruleset): NodeIndex {
    const index: NodeIndex = new Map()
    for (const node of ruleset.nodes) {
        if (index.has(node.id)) {
            throw new Error(`Duplicate node id: ${node.id}`)
        }
        index.set(node.id, node)
    }
    for (const node of ruleset.nodes) {
        for (const dep of node.dependsOn) {
            if (!index.has(dep)) {
                throw new Error(`Node ${node.id} depends on unknown node ${dep}`)
            }
        }
    }
    return index
}

/** Find every cycle (as a set of participating node ids) via DFS. */
export function detectCycles(ruleset: Ruleset): Set<NodeId>[] {
    const index = indexNodes(ruleset)
    const cycles: Set<NodeId>[] = []
    const state = new Map<NodeId, "visiting" | "done">()
    const stack: NodeId[] = []

    const visit = (id: NodeId): void => {
        const s = state.get(id)
        if (s === "done") return
        if (s === "visiting") {
            // Found a back-edge: capture the cycle from the stack.
            const start = stack.indexOf(id)
            if (start >= 0) cycles.push(new Set(stack.slice(start)))
            return
        }
        state.set(id, "visiting")
        stack.push(id)
        for (const dep of index.get(id)?.dependsOn ?? []) visit(dep)
        stack.pop()
        state.set(id, "done")
    }

    for (const node of ruleset.nodes) visit(node.id)
    return cycles
}

/** Throw if the graph contains a cycle not present in the declared inventory. */
export function assertCyclesDeclared(ruleset: Ruleset): void {
    const declared = ruleset.cycles.map((c) => new Set(c))
    const found = detectCycles(ruleset)
    for (const cycle of found) {
        const isDeclared = declared.some(
            (d) => d.size === cycle.size && [...cycle].every((id) => d.has(id)),
        )
        if (!isDeclared) {
            throw new Error(
                `Undeclared cycle in ruleset ${ruleset.id}: {${[...cycle].join(", ")}}`,
            )
        }
    }
}
