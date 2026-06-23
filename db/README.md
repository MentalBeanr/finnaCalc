# Tax Platform — Data Layer (Foundation)

This directory is the foundational data layer for the FinnaCalc tax platform. It
implements the **non-engine backbone** of [`docs/database-design.md`](../docs/database-design.md)
using **Drizzle ORM** over PostgreSQL.

> **Scope.** This is the *foundation* — identity, returns, inputs, documents,
> engine-output **storage**, the filing state machine, and the audit log. The tax
> **engine itself** (the form-line dependency graph + fixed-point solver of
> [`docs/tax-engine-specification.md`](../docs/tax-engine-specification.md)) is
> intentionally **not implemented yet**; the calc tables exist only as storage so
> it can slot in later without a migration.

## Layout

```
db/
  schema/
    enums.ts          Controlled vocabularies (status, types, states)
    identity.ts       users (NO SSN — IdP ref + vault tokens only)
    returns.ts        tax_returns, return_people (every person = vault token)
    inputs.ts         income_sources, deductions_claimed, credits_claimed
    documents.ts      document metadata (bytes live in object storage)
    calculations.ts   tax_calculations, form_line_values, calculation_traces  [storage only]
    filings.ts        filings (per-jurisdiction state machine), filing_events
    audit.ts          audit_logs (append-only, hash-chained)
    index.ts          re-exports the full schema
  client.ts           lazy, build-safe Drizzle client (connects on first use)
  index.ts            public entry point  ->  import { getDb, schema } from "@/db"
  migrations/         generated SQL migrations
```

## Design invariants honored here

- **Money is integer cents** (`bigint`), never floats (`database-design.md` §1).
- **No PII in the core schema.** SSNs/TINs/IP-PINs/bank numbers live in the
  separate **PII vault** store; the core tables reference them only by opaque
  `*_vault_token` (`database-design.md` §3, §6.2). The vault tables are deliberately
  **not** in this schema.
- **Immutable engine output.** `tax_calculations` / `form_line_values` are
  append-only snapshots; `form_line_values` is the single source the PDF renderer
  and MeF serializer read (`database-design.md` §16.3–16.4).
- **Per-jurisdiction filings** with an explicit state machine and an append-only
  `filing_events` log (`database-design.md` §8).
- **Audit log** is append-only and hash-chained; contains no raw PII
  (`database-design.md` §15).

## Build-safe by construction

`client.ts` connects **on first use, never at import time**. `next build` and CI
run without a `DATABASE_URL`; a missing URL throws only when the database is
actually queried at runtime. No page imports the data layer, so it stays out of
the client bundle.

## Workflow

```bash
# 1. Edit schema in db/schema/*.ts
# 2. Generate a SQL migration (no database needed):
pnpm db:generate
# 3. Apply migrations to a database (needs DATABASE_URL):
pnpm db:migrate
# 4. Inspect with Drizzle Studio (needs DATABASE_URL):
pnpm db:studio
```

Set `DATABASE_URL` in `.env.local` (copy from [`.env.example`](../.env.example)).

## Authentication boundary

Per the architecture (`tax-platform-architecture-v2.md` §5, "don't build your own
IdP"), the `users` table is keyed to an external identity provider by
`auth_provider_ref`. The server-side seam lives in
[`lib/server/auth.ts`](../lib/server/auth.ts):

- `getCurrentUser()` resolves the authenticated identity to the `users` row,
  provisioning it on first sign-in.
- The default provider is a no-op (build/CI/dev run with nobody signed in).
- [`lib/server/auth-clerk.ts`](../lib/server/auth-clerk.ts) is the production Clerk
  adapter, activated at startup with `setIdentityProvider(new ClerkIdentityProvider())`.

## Deferred to later phases

Present in `database-design.md`, intentionally **not** in this foundation:
the PII vault tables (separate store), the carryforward ledger, bank
instructions, payments, §7216 consents, e-signatures, and fraud review. Each
arrives with the phase that needs it (`tax-platform-architecture-v2.md` §8.4).
