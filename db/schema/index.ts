/**
 * Tax-platform database schema (foundation).
 *
 * Implements the foundational, non-engine backbone of docs/database-design.md:
 * identity, returns and people, user-asserted inputs, documents, engine-output
 * storage, the filing state machine, and the audit log.
 *
 * Deferred to later phases (present in the design, not in this foundation):
 * the PII vault tables (separate store), carryforward ledger, bank instructions,
 * payments, consents, e-signatures, and fraud review.
 */
export * from "./enums"
export * from "./identity"
export * from "./returns"
export * from "./inputs"
export * from "./documents"
export * from "./calculations"
export * from "./filings"
export * from "./filing-signing"
export * from "./payments"
export * from "./audit"
