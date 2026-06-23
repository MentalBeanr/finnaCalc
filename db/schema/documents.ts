/**
 * Document metadata. The bytes live in encrypted object storage; this table
 * holds only references and custody metadata (database-design.md §7.1).
 */
import { pgTable, uuid, text, bigint, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { users } from "./identity"
import { taxReturns } from "./returns"
import { documentKind } from "./enums"

export const documents = pgTable(
    "documents",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id),
        returnId: uuid("return_id").references(() => taxReturns.id),
        kind: documentKind("kind").notNull(),
        /** Object-storage key; bytes never touch this database. */
        objectKey: text("object_key").notNull(),
        bytesSize: bigint("bytes_size", { mode: "number" }).notNull(),
        mime: text("mime").notNull(),
        /** Hex-encoded SHA-256 for dedup and integrity. */
        sha256: text("sha256").notNull(),
        virusScanStatus: text("virus_scan_status").notNull().default("pending"),
        ocrStatus: text("ocr_status").notNull().default("none"),
        /** TRUE for filed PDFs / MeF payloads → Object Lock / WORM (database-design.md §7.2). */
        isFinal: boolean("is_final").notNull().default(false),
        encryptionKeyRef: text("encryption_key_ref").notNull(),
        uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        userIdx: index("documents_user_idx").on(t.userId),
        returnIdx: index("documents_return_idx").on(t.returnId),
    }),
)

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
