/**
 * Fixed-point evaluator (tax-engine-specification.md §3.3).
 *
 * NOT a single forward pass. Computed nodes are recomputed in a stable order
 * until no value changes (exact integer-cents stability), so genuine cycles
 * (taxable Social Security ↔ AGI ↔ IRA deduction) converge correctly. If the
 * iteration cap is hit, the result is a NonConvergence tripwire — the engine
 * never emits a number it is unsure about (§9).
 */
import { assertCyclesDeclared, indexNodes } from "./graph"
import type { EngineInput, EngineResult, NodeId, Ruleset, TraceEntry } from "./types"

export const MAX_ITERATIONS = 100

export function evaluate(input: EngineInput, ruleset: Ruleset): EngineResult {
    if (input.taxYear !== ruleset.taxYear) {
        throw new Error(
            `Tax year mismatch: input ${input.taxYear} vs ruleset ${ruleset.taxYear}.`,
        )
    }
    const index = indexNodes(ruleset)
    assertCyclesDeclared(ruleset)

    const values: Record<NodeId, number> = {}
    const computed: NodeId[] = []
    for (const node of ruleset.nodes) {
        if (node.kind === "input") {
            values[node.id] = input.values[node.id] ?? 0
        } else {
            values[node.id] = 0 // seed
            computed.push(node.id)
        }
    }

    const read = (id: NodeId): number => values[id] ?? 0

    let iterations = 0
    for (;;) {
        iterations++
        let changed = false
        for (const id of computed) {
            const node = index.get(id)!
            const next = Math.round(node.formula ? node.formula(read) : 0)
            if (next !== values[id]) {
                values[id] = next
                changed = true
            }
        }
        if (!changed) {
            return { converged: true, iterations, values, trace: buildTrace(ruleset, values) }
        }
        if (iterations >= MAX_ITERATIONS) {
            return {
                converged: false,
                iterations,
                values,
                trace: [],
                nonconvergence: { deltas: lastDeltas(ruleset, values, read) },
            }
        }
    }
}

function buildTrace(ruleset: Ruleset, values: Record<NodeId, number>): TraceEntry[] {
    const trace: TraceEntry[] = []
    for (const node of ruleset.nodes) {
        if (node.kind !== "computed") continue
        trace.push({
            nodeId: node.id,
            value: values[node.id],
            dependencies: node.dependsOn.map((d) => ({ nodeId: d, value: values[d] ?? 0 })),
            citation: node.citation,
        })
    }
    return trace
}

function lastDeltas(
    ruleset: Ruleset,
    values: Record<NodeId, number>,
    read: (id: NodeId) => number,
): Record<NodeId, number> {
    const deltas: Record<NodeId, number> = {}
    for (const node of ruleset.nodes) {
        if (node.kind !== "computed" || !node.formula) continue
        const recomputed = Math.round(node.formula(read))
        const delta = recomputed - values[node.id]
        if (delta !== 0) deltas[node.id] = delta
    }
    return deltas
}
