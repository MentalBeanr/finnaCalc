/**
 * Core engine types (tax-engine-specification.md §1, §2).
 *
 * A computation is a directed dependency graph of form-line / worksheet nodes,
 * evaluated to a fixed point. Nodes are addressable by their legal identity
 * (e.g. "F1040.L11"), so a result reconciles with the printed return and the
 * golden fixtures.
 */
import type { Cents } from "./money"

/** A node's legal address — a form line, worksheet line, or input. */
export type NodeId = string

export type DataType = "money" | "count" | "rate_bp" | "boolean"

/** A read accessor over the current values of a node's dependencies. */
export type Read = (id: NodeId) => number

export interface RuleNode {
    id: NodeId
    kind: "input" | "computed"
    dataType: DataType
    /** Declared dependencies — defines the graph's edges. */
    dependsOn: NodeId[]
    /** Pure formula over dependencies; absent for input nodes. */
    formula?: (read: Read) => number
    /** IRS form/line/publication reference for audit-grade explainability. */
    citation?: string
}

export interface Ruleset {
    id: string
    jurisdiction: string
    taxYear: number
    nodes: RuleNode[]
    /** The declared cycle inventory: every genuine cycle in the graph (§3.4). */
    cycles: NodeId[][]
}

export interface EngineInput {
    taxYear: number
    /** Seed values for input nodes, keyed by NodeId. */
    values: Record<NodeId, number>
}

export interface TraceEntry {
    nodeId: NodeId
    value: number
    dependencies: { nodeId: NodeId; value: number }[]
    citation?: string
}

export interface NonConvergence {
    /** Per-node deltas at the iteration cap (the values that wouldn't settle). */
    deltas: Record<NodeId, number>
}

export interface EngineResult {
    converged: boolean
    iterations: number
    /** Final value of every node, keyed by NodeId (cents for money nodes). */
    values: Record<NodeId, Cents | number>
    trace: TraceEntry[]
    /** Present iff converged === false (a tripwire — never produces a filed number). */
    nonconvergence?: NonConvergence
}
