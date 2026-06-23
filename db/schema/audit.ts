/**
 * Audit log (database-design.md §11.1, §15).
 *
 * Append-only, hash-chained, tamper-evident. Contains NO raw PII — `resourceId`
 * is a token/uuid; `action` is structured. In production this lives in a SEPARATE
 * physical store with an INSERT-only role; it is colocated in the schema here for
 * the foundation, with that separation called out in db/README.md.
 *
 * The `prevHash`/`rowHash` columns form the integrity chain verified by a
 * periodic walker (database-design.md §15.2).
 */
import { pgTable, bigserial, uuid, text, boolean, timestamp, inet, index } from "drizzle-orm/pg-core"
import { auditActorKind } from "./enums"

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: bigserial("id", { mode: "number" }).primaryKey(),
        requestId: uuid("request_id").notNull(),
        actorKind: auditActorKind("actor_kind").notNull(),
        /** user_id | admin_id | service name. */
        actorId: text("actor_id"),
        /** e.g. vault.decrypt | return.state_change | facts.edit | doc.upload. */
        action: text("action").notNull(),
        /** e.g. vault.person_identity | tax_return | document. */
        resourceKind: text("resource_kind").notNull(),
        /** Token / uuid / object key — NEVER plaintext PII. */
        resourceId: text("resource_id").notNull(),
        accessedPii: boolean("accessed_pii").notNull(),
        purpose: text("purpose"),
        ip: inet("ip"),
        userAgent: text("user_agent"),
        at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
        /** Hash of the previous row (tamper-evidence chain). */
        prevHash: text("prev_hash").notNull(),
        /** Hash of this row's canonical serialization. */
        rowHash: text("row_hash").notNull(),
    },
    (t) => ({
        resourceIdx: index("audit_logs_resource_idx").on(t.resourceKind, t.resourceId, t.at),
        actorIdx: index("audit_logs_actor_idx").on(t.actorKind, t.actorId, t.at),
    }),
)

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
