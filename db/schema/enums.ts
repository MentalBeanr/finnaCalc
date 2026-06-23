/**
 * Enumerated types for the tax-platform foundation.
 *
 * Mirrors the controlled vocabularies in docs/database-design.md. These are the
 * stable, low-cardinality value sets the application code branches on.
 */
import { pgEnum } from "drizzle-orm/pg-core"

/** Account lifecycle (database-design.md §4.1). */
export const userStatus = pgEnum("user_status", ["active", "locked", "closed"])

/** Federal filing status (database-design.md §5.1). */
export const filingStatus = pgEnum("filing_status", [
    "single",
    "mfj", // married filing jointly
    "mfs", // married filing separately
    "hoh", // head of household
    "qss", // qualifying surviving spouse
])

/**
 * The return lifecycle state machine (database-design.md §16.1).
 * Mutable on the return; transitions are audited.
 */
export const returnState = pgEnum("return_state", [
    "draft",
    "ready_to_review",
    "ready_to_file",
    "signed",
    "submitted",
    "accepted",
    "rejected",
    "amended",
])

/** Original vs. amendment (database-design.md §5.1, §16.5). */
export const returnKind = pgEnum("return_kind", ["original", "amendment"])

/** Who a person on the return is (database-design.md §4.3). */
export const personRole = pgEnum("person_role", ["taxpayer", "spouse", "dependent"])

/** Taxpayer-identifier status used by return-rule logic (database-design.md §4.3). */
export const ssnStatus = pgEnum("ssn_status", ["valid", "itin", "pending", "invalid"])

/** Income source classifications (database-design.md §5.2). */
export const incomeType = pgEnum("income_type", [
    "w2",
    "1099_nec",
    "1099_int",
    "1099_div",
    "1099_b",
    "1099_r",
    "sch_c",
    "rental",
    "ss",
    "other",
])

/** Deduction classifications (database-design.md §5.3). */
export const deductionType = pgEnum("deduction_type", [
    "mortgage_interest",
    "salt",
    "charitable",
    "medical",
    "student_loan",
    "aotc_expenses",
    "property_tax",
    "other",
])

/** Credit classifications (database-design.md §5.3). */
export const creditType = pgEnum("credit_type", [
    "ctc",
    "actc",
    "eitc",
    "aotc",
    "llc",
    "cdcc",
    "saver",
    "other",
])

/** Document classifications (database-design.md §7.1). */
export const documentKind = pgEnum("document_kind", [
    "w2",
    "1099",
    "1095_a",
    "receipt",
    "filed_return_pdf",
    "mef_payload",
    "other",
])

/** Transmission channel for a filing (database-design.md §8.1). */
export const filingChannel = pgEnum("filing_channel", ["partner", "direct_mef"])

/** Federal/state submission linkage (database-design.md §8.1). */
export const filingLinkage = pgEnum("filing_linkage", ["linked_fed_state", "unlinked"])

/** The per-jurisdiction submission state machine (database-design.md §8.1). */
export const filingState = pgEnum("filing_state", [
    "built",
    "transmitted",
    "received",
    "validated",
    "accepted",
    "rejected",
    "imperfect",
])

/** Who/what performed an audited action (database-design.md §11.1). */
export const auditActorKind = pgEnum("audit_actor_kind", [
    "user",
    "admin",
    "system",
    "partner",
    "irs",
])

/** Money flows: filing fee (PSP) vs. IRS-rail balance-due/refund (database-design.md §9.2). */
export const paymentKind = pgEnum("payment_kind", ["filing_fee", "balance_due", "refund_ref"])

export const paymentStatus = pgEnum("payment_status", [
    "pending",
    "authorized",
    "captured",
    "failed",
    "refunded",
    "settled",
])
