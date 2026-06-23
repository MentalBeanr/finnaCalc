import { describe, it, expect } from "vitest"
import { evaluate } from "@/tax-engine/core/solver"
import { assertCyclesDeclared, detectCycles } from "@/tax-engine/core/graph"
import type { Ruleset } from "@/tax-engine/core/types"

/** A genuine cycle (x ↔ y) that converges to a fixed point. */
const convergent: Ruleset = {
    id: "test:convergent",
    jurisdiction: "test",
    taxYear: 2024,
    nodes: [
        { id: "c", kind: "input", dataType: "money", dependsOn: [] },
        {
            id: "x",
            kind: "computed",
            dataType: "money",
            dependsOn: ["c", "y"],
            formula: (r) => Math.round((r("c") + r("y")) / 2),
        },
        {
            id: "y",
            kind: "computed",
            dataType: "money",
            dependsOn: ["c", "x"],
            formula: (r) => Math.round((r("c") + r("x")) / 2),
        },
    ],
    cycles: [["x", "y"]],
}

/** A divergent cycle that never settles. */
const divergent: Ruleset = {
    id: "test:divergent",
    jurisdiction: "test",
    taxYear: 2024,
    nodes: [
        {
            id: "x",
            kind: "computed",
            dataType: "money",
            dependsOn: ["y"],
            formula: (r) => r("y") + 1000,
        },
        {
            id: "y",
            kind: "computed",
            dataType: "money",
            dependsOn: ["x"],
            formula: (r) => r("x") + 1000,
        },
    ],
    cycles: [["x", "y"]],
}

describe("fixed-point solver", () => {
    it("converges a genuine cycle to its fixed point", () => {
        const result = evaluate({ taxYear: 2024, values: { c: 900 } }, convergent)
        expect(result.converged).toBe(true)
        expect(result.iterations).toBeGreaterThan(1) // it actually iterated
        expect(result.values.x).toBe(900)
        expect(result.values.y).toBe(900)
    })

    it("trips on a divergent cycle instead of emitting a number", () => {
        const result = evaluate({ taxYear: 2024, values: {} }, divergent)
        expect(result.converged).toBe(false)
        expect(result.nonconvergence).toBeDefined()
        expect(result.trace).toEqual([])
    })

    it("rejects a tax-year mismatch", () => {
        expect(() => evaluate({ taxYear: 2023, values: {} }, convergent)).toThrow(/mismatch/)
    })
})

describe("cycle inventory", () => {
    it("detects the cycle in the graph", () => {
        const cycles = detectCycles(convergent)
        expect(cycles).toHaveLength(1)
        expect(cycles[0]).toEqual(new Set(["x", "y"]))
    })

    it("throws when a cycle is undeclared", () => {
        const undeclared: Ruleset = { ...divergent, cycles: [] }
        expect(() => assertCyclesDeclared(undeclared)).toThrow(/Undeclared cycle/)
    })

    it("accepts a declared cycle", () => {
        expect(() => assertCyclesDeclared(convergent)).not.toThrow()
    })
})
