/**
 * Filing and the submission state machine.
 *
 * One `filings` row per (return, jurisdiction) — federal and each state run their
 * own state machine. A failed submission produces a NEW row when rebuilt; attempts
 * are append-only. `filing_events` is the replayable transition log
 * (database-design.md §8).
 */
import {
    pgTable,
    uuid,
    text,
    jsonb,
    timestamp,
    bigserial,
    index,
} from "drizzle-orm/pg-core"
import { taxReturns } from "./returns"
import { taxCalculations } from "./calculations"
import { documents } from "./documents"
import { filingChannel, filingLinkage, filingState } from "./enums"

export const filings = pgTable(
    "filings",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        returnId: uuid("return_id")
            .notNull()
            .references(() => taxReturns.id),
        /** 'federal' | 'state:CA' | 'state:NY' | ... */
        jurisdiction: text("jurisdiction").notNull(),
        channel: filingChannel("channel").notNull(),
        linkage: filingLinkage("linkage").notNull().default("unlinked"),
        state: filingState("state").notNull().default("built"),
        /** IRS/partner reference. */
        submissionId: text("submission_id"),
        calculationId: uuid("calculation_id")
            .notNull()
            .references(() => taxCalculations.id),
        mefPayloadDocId: uuid("mef_payload_doc_id").references(() => documents.id),
        filedPdfDocId: uuid("filed_pdf_doc_id").references(() => documents.id),
        ackCode: text("ack_code"),
        /** Array of { code, desc } reject entries. */
        rejectCodes: jsonb("reject_codes"),
        builtAt: timestamp("built_at", { withTimezone: true }).notNull().defaultNow(),
        transmittedAt: timestamp("transmitted_at", { withTimezone: true }),
        receivedAt: timestamp("received_at", { withTimezone: true }),
        validatedAt: timestamp("validated_at", { withTimezone: true }),
        acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    },
    (t) => ({
        returnJurisIdx: index("filings_return_juris_idx").on(t.returnId, t.jurisdiction),
        stateIdx: index("filings_state_idx").on(t.state, t.transmittedAt),
    }),
)

export const filingEvents = pgTable(
    "filing_events",
    {
        id: bigserial("id", { mode: "number" }).primaryKey(),
        filingId: uuid("filing_id")
            .notNull()
            .references(() => filings.id),
        fromState: text("from_state"),
        toState: text("to_state").notNull(),
        /** transmit | ack | reject | imperfect | manual_override | timeout */
        eventKind: text("event_kind").notNull(),
        /** Raw ack/reject body, sanitized (no PII). */
        payload: jsonb("payload"),
        /** system | partner | irs | admin:<id> */
        actor: text("actor").notNull(),
        at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        filingIdx: index("filing_events_filing_idx").on(t.filingId, t.at),
    }),
)

export type Filing = typeof filings.$inferSelect
export type NewFiling = typeof filings.$inferInsert
export type FilingEvent = typeof filingEvents.$inferSelect
export type NewFilingEvent = typeof filingEvents.$inferInsert
