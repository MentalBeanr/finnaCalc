# FinnaCalc Tax Platform — Database Design

**Companion to:** `docs/tax-platform-architecture-v2.md` (the approved architecture)
**Document type:** Database design (schema, relationships, indexing, audit, versioning)
**Status:** DRAFT FOR REVIEW — illustrative DDL, not migration code
**Engine:** PostgreSQL 16+ (managed)

> **Scope and posture.** This design implements the v2 architecture's data model literally: form-line values are the engine's single source of truth (v2 §4.5); every person on a return — including minors — is a vault-protected identity (v2 §5.2, §6.3); carryforwards are a first-class append-only ledger (v2 §4.6, §5.3); filings run a per-jurisdiction state machine (v2 §5.5, §7.2); and the PII decryption path is minimized to two named consumers with mandatory pre-decrypt audit (v2 §6.2). All amounts are integer cents. Where this document and v1 conflict, v2 wins (this document is the v2 schema).

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Physical Store Separation](#2-physical-store-separation)
3. [Entity-Relationship Diagram](#3-entity-relationship-diagram)
4. [Identity & People](#4-identity--people)
5. [Returns & Facts](#5-returns--facts)
6. [Engine Output: Calculations, Form-Line Values, Carryforwards](#6-engine-output)
7. [Documents](#7-documents)
8. [Filing & Submission State Machine](#8-filing--submission-state-machine)
9. [Money: Bank Instructions & Payments](#9-money-bank-instructions--payments)
10. [Trust Artifacts: Consents, Signatures, Fraud](#10-trust-artifacts)
11. [Audit & Admin Access](#11-audit--admin-access)
12. [Notifications](#12-notifications)
13. [Relationships & Cardinalities (Summary)](#13-relationships--cardinalities)
14. [Indexing & Partitioning Strategy](#14-indexing--partitioning-strategy)
15. [Audit Logging Strategy](#15-audit-logging-strategy)
16. [Tax Return Versioning](#16-tax-return-versioning)
17. [Retention, Deletion, Crypto-Shredding](#17-retention-deletion-crypto-shredding)
18. [Schema Evolution Discipline](#18-schema-evolution-discipline)
19. [Open Questions](#19-open-questions--out-of-scope)

---

## 1. Design Principles

1. **Money is integer cents** (`BIGINT`). No floats anywhere money lives. Rounding is the engine's responsibility (v2 §4.8 `money.ts`); the database stores results.
2. **Tax year is on everything that varies by it.** Returns, calculations, form-line values, carryforwards, and rulesets all carry `tax_year`. This is what makes "versioned by tax year" real at the data layer (v2 §4.1).
3. **PII is vault-only.** SSNs/TINs (taxpayer, spouse, **every dependent including minors**), IP PINs, and bank account/routing numbers live **only** in the vault; the core RDBMS holds **tokens** (opaque references) — never the values, never even encrypted-but-co-located ciphertext. (Resolves review S1/S2.)
4. **Immutable where it matters.** Calculations, form-line value sets, filings (per attempt), e-signatures, consents, and audit log entries are **append-only**. Mutation is reserved for return *state* and user *facts*; legal/financial artifacts are insert-only.
5. **Snapshots, not edits, are the source of truth at filing.** What we filed is a frozen snapshot of facts + ruleset + form-line values + signature + the MeF payload, retained forever. (Resolves review A4 reconciliation guarantee.)
6. **The engine is stateless; the database is not.** No engine logic in the database — no triggers computing tax, no stored procedures evaluating rules. The DB is a faithful, indexed, queryable store of *inputs to* and *outputs from* the engine.
7. **Soft delete and crypto-shred — never hard delete.** Retention is statutory; deletion is a scheduled, audited lifecycle event, not a `DELETE` (v2 §9, S6).
8. **Audit before plaintext.** Vault decryption emits an audit event *before* returning plaintext to the (only two) allowed consumers (v2 §6.2).

---

## 2. Physical Store Separation

Five distinct stores, by trust and access pattern. Sharing a Postgres cluster is fine *only* with hard schema separation, separate roles, and separate KMS key hierarchies.

| Store | Tech | What lives there | Keys | Notes |
|---|---|---|---|---|
| **Core RDBMS** | Postgres (managed, multi-AZ) | All non-PII business data: users (no SSN), returns, facts, calculations, form-line values, filings, payments, carryforwards, notifications, bank-instruction metadata (token + change controls only) | Standard envelope encryption | The default home for new tables. |
| **PII Vault** | Separate Postgres instance (or schema with separate role + KMS key) | `ssn`, `tin`, `ip_pin`, `bank_account_number`, `bank_routing_number` — encrypted at the field level | **Separate KMS key hierarchy**; HSM-rooted; rotation policy distinct from core | Accessible only by the Vault Service; every read audited *before* plaintext returns. |
| **Object Storage** | S3-class (SSE-KMS, versioning, **Object Lock** for filed snapshots) | Uploaded tax documents (W-2/1099/1095-A images/PDFs), filed-return PDFs, MeF XML payloads | Per-object data keys via KMS | Object Lock (WORM) for finals; lifecycle for drafts. |
| **Audit Log Store** | Append-only Postgres (separate cluster) or purpose-built immutable store | Hash-chained audit events | Separate KMS key | No raw PII — only tokenized refs. |
| **Analytics Warehouse** | Separate warehouse | **Privacy-scrubbed** events only — never raw amounts, never PII | Standard | Out of scope for this doc; mentioned for completeness. |

> **The decryption path is concrete.** The only two services with vault read grants are the **MeF Serializer** (at transmission) and the **PDF Renderer** (at user-initiated view/download), per v2 §6.2. The Vault Service enforces this in policy.

---

## 3. Entity-Relationship Diagram

```
                                  ┌──────────────────────┐
                                  │        users         │
                                  │  (no SSN; profile)   │
                                  └─────────┬────────────┘
                                            │ 1:N
                          ┌─────────────────┼───────────────────────────┐
                          │                 │                           │
                ┌─────────▼────────┐  ┌─────▼──────────┐   ┌────────────▼──────────┐
                │   tax_returns    │  │ carryforwards  │   │    notifications      │
                │  (per user×year, │  │ (append-only   │   │                       │
                │   has state)     │  │  ledger)       │   └───────────────────────┘
                └─┬────┬────┬────┬┘  └────────┬───────┘
                  │    │    │    │            │
                  │    │    │    │            │ recomputed-from
                  │    │    │    │            │
                  │    │    │    └──1:N─▶ tax_calculations (immutable snapshots)
                  │    │    │                    │
                  │    │    │                    ├──1:N─▶ form_line_values (per calc)
                  │    │    │                    └──1:1─▶ calculation_trace (JSONB)
                  │    │    │
                  │    │    └──1:N─▶ filings (per-jurisdiction state machine)
                  │    │                  │
                  │    │                  ├──1:N─▶ filing_events (transitions)
                  │    │                  └──1:N─▶ reject_remediations
                  │    │
                  │    └──1:N─▶ return_people (taxpayer | spouse | dependent)
                  │                      │
                  │                      └──N:1─▶ pii_vault.person_identity (vault: SSN, IP PIN)
                  │
                  ├──1:N─▶ income_sources / deductions_claimed / credits_claimed
                  ├──1:1─▶ return_facts_misc (JSONB long-tail)
                  ├──1:N─▶ documents (metadata; bytes in object storage)
                  ├──1:N─▶ bank_instructions ──N:1─▶ pii_vault.bank_account
                  ├──1:N─▶ payments
                  ├──1:N─▶ consents_signed  (§7216 records, immutable)
                  ├──1:1─▶ e_signature      (Self-Select PIN signature event)
                  └──1:N─▶ fraud_review_items

      ┌──────────────────────────────────────────────────────────────────────┐
      │           audit_logs (separate store, hash-chained, append-only)       │
      │  references every PII access, return state transition, admin action    │
      └──────────────────────────────────────────────────────────────────────┘
      ┌──────────────────────────────────────────────────────────────────────┐
      │  admin_access_grants (JIT, reason-logged, four-eyes for high-risk)      │
      └──────────────────────────────────────────────────────────────────────┘
```

Detailed sub-diagrams appear inline with each domain section below.

---

## 4. Identity & People

### 4.1 `users` (core)
The account. Holds **no SSN**. Auth credentials live with the managed IdP (v2 §5), not here.

```sql
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               CITEXT UNIQUE NOT NULL,
    auth_provider_ref   TEXT NOT NULL,                -- IdP subject ID
    display_name        TEXT,
    mfa_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    locale              TEXT DEFAULT 'en-US',
    status              TEXT NOT NULL DEFAULT 'active', -- active|locked|closed
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at           TIMESTAMPTZ                    -- soft-close; retention-bound
);
```

**Indexes:** `UNIQUE(email)` (CITEXT); `INDEX(auth_provider_ref)`; partial `INDEX(status) WHERE status <> 'active'`.

### 4.2 `pii_vault.person_identity` (vault store)
**Lives in the vault, not the core RDBMS.** One row per real person *on any return* (taxpayer/spouse/dependent — including minors). Owns the SSN/TIN and per-year IP PIN.

```sql
-- IN THE VAULT STORE (separate KMS key)
CREATE TABLE pii_vault.person_identity (
    token               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ssn_or_tin_enc      BYTEA NOT NULL,                -- envelope-encrypted, separate KMS key
    ssn_or_tin_hash     BYTEA NOT NULL,                -- HMAC for duplicate-detection (NEVER reversible)
    kind                TEXT NOT NULL,                 -- ssn | itin | atin
    key_version         INTEGER NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX person_identity_hash_uniq ON pii_vault.person_identity(ssn_or_tin_hash);

-- Per-year IP PIN, separately rotated
CREATE TABLE pii_vault.ip_pin (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_token        UUID NOT NULL REFERENCES pii_vault.person_identity(token),
    tax_year            SMALLINT NOT NULL,
    pin_enc             BYTEA NOT NULL,                -- 6-digit IP PIN, encrypted
    key_version         INTEGER NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (person_token, tax_year)
);
```

> **Why HMAC hash?** Lets us deduplicate (catch a single SSN claimed across two accounts → fraud signal) **without** ever recovering the SSN from the hash. The HMAC key is held by the Vault Service alone.

### 4.3 `return_people` (core)
The per-return roster. Links a return to vault person identities; carries **role**, **relationship**, **minor flag**, and per-year tax-relevant attributes (qualifying-child, etc.).

```sql
CREATE TABLE return_people (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id           UUID NOT NULL REFERENCES tax_returns(id) ON DELETE RESTRICT,
    role                TEXT NOT NULL,                 -- taxpayer | spouse | dependent
    ordinal             SMALLINT NOT NULL,             -- 0=taxpayer, 1=spouse, 2..N=dependents
    person_vault_token  UUID NOT NULL,                 -- → pii_vault.person_identity(token)
    legal_first_name    TEXT NOT NULL,                 -- not PII at the SSN level, but still sensitive
    legal_last_name     TEXT NOT NULL,
    date_of_birth       DATE NOT NULL,
    is_minor            BOOLEAN NOT NULL,              -- derived from DOB at return creation
    relationship        TEXT,                          -- son|daughter|stepchild|foster|...
    qualifying_child    BOOLEAN,
    qualifying_relative BOOLEAN,
    ssn_status          TEXT,                          -- valid|itin|pending|invalid (for return-rule logic)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (return_id, ordinal)
);
```

**Indexes:** `INDEX(return_id)`; `INDEX(person_vault_token)`; partial `INDEX(is_minor) WHERE is_minor` for retention/breach playbook queries.

> **Names are sensitive but not crown-jewels.** They are NOT stored in the vault (you have to search/display them constantly). They ARE redacted from logs and excluded from analytics.

---

## 5. Returns & Facts

### 5.1 `tax_returns` (core)
The mutable shell of a return. State machine + a pointer to the **kind** (original vs. amendment). Original snapshots live in `tax_calculations` (§6).

```sql
CREATE TABLE tax_returns (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    tax_year            SMALLINT NOT NULL,
    kind                TEXT NOT NULL DEFAULT 'original',  -- original | amendment
    amends_return_id    UUID REFERENCES tax_returns(id),   -- non-null iff kind='amendment'
    filing_status       TEXT,                              -- single|mfj|mfs|hoh|qss
    state_of_residence  CHAR(2),                           -- USPS code; affects state engine
    ruleset_id          TEXT,                              -- engine ruleset binding (e.g. 'ty2024')
    state               TEXT NOT NULL DEFAULT 'draft',     -- see §16 lifecycle
    in_scope_decision   TEXT,                              -- supported | declined_reason_code
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at        TIMESTAMPTZ,
    accepted_at         TIMESTAMPTZ
);
```

**Constraints/indexes:**
- `UNIQUE(user_id, tax_year, kind, amends_return_id)` — at most one *original* per user×year; amendments are unique per `(user, year, amends_return_id, ordinal)` (an extra column if multiple amendments are expected — recommend adding `amendment_ordinal SMALLINT` when V2 supports superseded amendments).
- `INDEX(user_id, tax_year)` — primary access pattern.
- **Partition:** `PARTITION BY LIST(tax_year)` — see §14.

### 5.2 `income_sources` (core)
Normalized rows for the common, named income types. Long-tail oddities go in `return_facts_misc`.

```sql
CREATE TABLE income_sources (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id           UUID NOT NULL REFERENCES tax_returns(id) ON DELETE CASCADE,
    type                TEXT NOT NULL,                 -- w2 | 1099_nec | 1099_int | 1099_div | 1099_b | 1099_r | sch_c | rental | ss | ...
    payer_name          TEXT,                          -- "ACME Corp"
    payer_ein_token     UUID,                          -- if EIN is sensitive enough to vault, token; otherwise nullable plain
    amount_cents        BIGINT NOT NULL,
    withholding_cents   BIGINT NOT NULL DEFAULT 0,
    person_id           UUID REFERENCES return_people(id),  -- whose income (taxpayer/spouse)
    source_document_id  UUID REFERENCES documents(id),
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb, -- box-level fields (W-2 box 12, 1099-B lots ref, etc.)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX income_sources_return ON income_sources(return_id);
CREATE INDEX income_sources_type   ON income_sources(return_id, type);
```

### 5.3 `deductions_claimed`, `credits_claimed` (core)
Same shape as `income_sources`. Inputs the user *asserts*; the engine decides what's *allowed* (the allowed amount is a form-line value in §6).

```sql
CREATE TABLE deductions_claimed (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id    UUID NOT NULL REFERENCES tax_returns(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,                       -- mortgage_interest|salt|charitable|medical|student_loan|...
    amount_cents BIGINT NOT NULL,
    metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX deductions_claimed_return ON deductions_claimed(return_id);

CREATE TABLE credits_claimed (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id            UUID NOT NULL REFERENCES tax_returns(id) ON DELETE CASCADE,
    type                 TEXT NOT NULL,              -- ctc|actc|eitc|aotc|llc|cdcc|saver|...
    qualifying_count     SMALLINT,                   -- e.g., qualifying-child count
    amount_claimed_cents BIGINT,
    metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX credits_claimed_return ON credits_claimed(return_id);
```

### 5.4 `return_facts_misc` (core)
Single JSONB row per return for the long-tail (small one-off interview answers that don't justify a column). Schema-validated *outside* the DB by the Fact Mediation Layer (v2 §4.7).

```sql
CREATE TABLE return_facts_misc (
    return_id    UUID PRIMARY KEY REFERENCES tax_returns(id) ON DELETE CASCADE,
    facts        JSONB NOT NULL DEFAULT '{}'::jsonb,
    schema_ver   INTEGER NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Edit history of facts is *not* row-versioned in OLTP.** The filing snapshot (§16) is the source of legal truth; live edits before submission are tracked by the audit log (every fact change is an audit event), not by row-history bloat in the hot table.

---

## 6. Engine Output

### 6.1 `tax_calculations` (core, **immutable**)
A row per *engine invocation* — append-only. The latest `(return_id, computed_at)` is the "current" calculation; older rows are history. The submitted/filed calculation is referenced by `filings.calculation_id`.

```sql
CREATE TABLE tax_calculations (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id                UUID NOT NULL REFERENCES tax_returns(id),
    tax_year                 SMALLINT NOT NULL,
    ruleset_id               TEXT NOT NULL,                   -- which engine version computed this
    engine_version           TEXT NOT NULL,                   -- git sha / semver of /tax-engine
    inputs_hash              BYTEA NOT NULL,                  -- hash of fact-snapshot inputs
    converged                BOOLEAN NOT NULL,                -- fixed-point convergence (v2 §4.3)
    iterations               SMALLINT NOT NULL,
    nonconvergence_reason    TEXT,                            -- non-null iff converged=false (alerts)
    -- Headline summary (denormalized from form_line_values for query speed)
    total_income_cents       BIGINT,
    agi_cents                BIGINT,
    deduction_cents          BIGINT,
    using_itemized           BOOLEAN,
    taxable_income_cents     BIGINT,
    tax_before_credits_cents BIGINT,
    credits_cents            BIGINT,
    tax_after_credits_cents  BIGINT,
    withholding_cents        BIGINT,
    refund_or_due_cents      BIGINT,                          -- positive = refund, negative = balance due
    marginal_rate_bp         SMALLINT,                        -- basis points (2400 = 24%)
    computed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- HARD: no UPDATE; no DELETE; enforced by role privileges
    CHECK (converged OR nonconvergence_reason IS NOT NULL)
);
CREATE INDEX tax_calculations_return_time ON tax_calculations(return_id, computed_at DESC);
CREATE INDEX tax_calculations_inputs_hash ON tax_calculations(return_id, inputs_hash);
-- Partition: by tax_year (see §14).
```

> **Why `inputs_hash`?** Lets us short-circuit unchanged-input recomputation (the engine already does this via dirty-tracking — this is the DB-side cache key for the *same* memoization across sessions/devices).

### 6.2 `form_line_values` (core, **immutable per calculation**)
The **engine's single source of truth** (v2 §4.5). Every form line, addressable by its legal identity. Both the PDF renderer and the MeF serializer read **this table** — neither recomputes anything.

```sql
CREATE TABLE form_line_values (
    calculation_id    UUID NOT NULL REFERENCES tax_calculations(id) ON DELETE RESTRICT,
    form_id           TEXT NOT NULL,                  -- 'F1040' | 'SCH1' | 'F8962' | ...
    line_id           TEXT NOT NULL,                  -- 'L11' | 'L6b' | 'L8'
    value_cents       BIGINT,                         -- nullable for non-monetary lines
    value_text        TEXT,                           -- nullable; for non-monetary line content
    cite_pub_ref      TEXT,                           -- IRS publication/form citation
    PRIMARY KEY (calculation_id, form_id, line_id)
);
-- Partition by hash(calculation_id) for write-scaling, or by parent tax_year (see §14).
```

**Volume note.** A typical individual return has ~100–300 form-line rows. To keep this table sane: **only the latest non-submitted calculation's lines are kept for an in-progress return**; submitted/filed calculations' lines are kept **forever** (WORM-archived). The retention job is documented in §17.

### 6.3 `calculation_trace` (core, **immutable, JSONB**)
The citation-linked explainability trace from v2 §4.1 (`trace.ts`). One JSONB blob per calculation; this powers in-product explanations and audit support.

```sql
CREATE TABLE calculation_trace (
    calculation_id    UUID PRIMARY KEY REFERENCES tax_calculations(id) ON DELETE RESTRICT,
    trace             JSONB NOT NULL                  -- [{node:'F1040.L11', formula:'sum(...)', deps:[...], cite:'Pub17/L11'}, ...]
);
```

### 6.4 `carryforwards` (core, **append-only ledger** — v2 §4.6, §5.3)
The multi-year state that makes a return *not* year-independent. An amended prior year **supersedes** its prior carryforward rows and **cascades forward**.

```sql
CREATE TABLE carryforwards (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users(id),
    tax_year                 SMALLINT NOT NULL,             -- the year FROM which this carryforward originates
    type                     TEXT NOT NULL,                  -- cap_loss | nol | amt_credit | pal | charitable | sec179 | prior_agi | aptc_fact
    amount_cents             BIGINT,                         -- nullable for non-monetary facts (e.g. prior_agi has cents though)
    payload                  JSONB,                          -- for non-scalar carryforwards (e.g. lot details)
    source_return_id         UUID NOT NULL REFERENCES tax_returns(id),
    source_calculation_id    UUID NOT NULL REFERENCES tax_calculations(id),
    superseded_by_return_id  UUID REFERENCES tax_returns(id),
    superseded_at            TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        (superseded_by_return_id IS NULL AND superseded_at IS NULL) OR
        (superseded_by_return_id IS NOT NULL AND superseded_at IS NOT NULL)
    )
);
CREATE INDEX carryforwards_user_year_type
    ON carryforwards(user_id, tax_year, type)
    WHERE superseded_at IS NULL;                              -- "active" view = where supersession is null
```

> **Supersession, not overwrite.** When the user amends TY2024, the engine produces a new TY2024→TY2025 carryforward set; the new rows are inserted and the *old* rows have `superseded_by_return_id` populated. TY2025's next calculation reads the *active* carryforwards and is itself re-emitted; the cascade is bounded by the number of subsequent filed years.

---

## 7. Documents

### 7.1 `documents` (core, metadata)
Bytes live in object storage; the DB holds metadata + reference.

```sql
CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    return_id           UUID REFERENCES tax_returns(id) ON DELETE SET NULL,
    kind                TEXT NOT NULL,                  -- w2 | 1099_* | 1095_a | receipt | filed_return_pdf | mef_payload | other
    object_key          TEXT NOT NULL,                  -- S3 key
    bytes_size          BIGINT NOT NULL,
    mime                TEXT NOT NULL,
    sha256              BYTEA NOT NULL,
    virus_scan_status   TEXT NOT NULL DEFAULT 'pending',-- pending|clean|quarantined|failed
    ocr_status          TEXT NOT NULL DEFAULT 'none',   -- none|queued|done|failed (V2+)
    is_final            BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE for filed PDFs / MeF payloads → Object Lock
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    encryption_key_ref  TEXT NOT NULL                   -- KMS data key ref
);
CREATE INDEX documents_user      ON documents(user_id);
CREATE INDEX documents_return    ON documents(return_id);
CREATE INDEX documents_is_final  ON documents(return_id) WHERE is_final;
CREATE UNIQUE INDEX documents_sha256_uniq ON documents(user_id, sha256);  -- per-user dedup
```

### 7.2 Filed-return artifacts
Both the **printed PDF** and the **MeF XML payload** are stored as `documents` rows with `kind IN ('filed_return_pdf','mef_payload')`, `is_final = TRUE`, and Object-Lock-enforced retention. They are *derived* from `form_line_values` (v2 §4.5) and a successful reconciliation diff is a precondition to insertion (§7.3 of v2).

---

## 8. Filing & Submission State Machine

### 8.1 `filings` (core)
**One row per (return, jurisdiction)** — federal and each state run their own state machine (resolves review C3). A failed submission produces a *new* `filings` row when rebuilt-and-retransmitted, not a mutation.

```sql
CREATE TABLE filings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id           UUID NOT NULL REFERENCES tax_returns(id),
    jurisdiction        TEXT NOT NULL,                  -- 'federal' | 'state:CA' | 'state:NY' | ...
    channel             TEXT NOT NULL,                  -- partner | direct_mef
    linkage             TEXT NOT NULL DEFAULT 'unlinked',-- linked_fed_state | unlinked
    state               TEXT NOT NULL DEFAULT 'built',  -- built|transmitted|received|validated|accepted|rejected|imperfect
    submission_id       TEXT,                           -- IRS/partner reference
    calculation_id      UUID NOT NULL REFERENCES tax_calculations(id),
    mef_payload_doc_id  UUID REFERENCES documents(id),
    filed_pdf_doc_id    UUID REFERENCES documents(id),
    ack_code            TEXT,
    reject_codes        JSONB,                          -- [{code:'IND-031-04', desc:'...'}, ...]
    built_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    transmitted_at      TIMESTAMPTZ,
    received_at         TIMESTAMPTZ,
    validated_at        TIMESTAMPTZ,
    acknowledged_at     TIMESTAMPTZ,
    CHECK (state IN ('built','transmitted','received','validated','accepted','rejected','imperfect'))
);
CREATE INDEX filings_return_juris    ON filings(return_id, jurisdiction);
CREATE INDEX filings_state_for_ops   ON filings(state, transmitted_at) WHERE state IN ('transmitted','received','validated');
```

### 8.2 `filing_events` (core, **append-only**)
Every state transition is an event row — the lifecycle is *replayable*.

```sql
CREATE TABLE filing_events (
    id                  BIGSERIAL PRIMARY KEY,
    filing_id           UUID NOT NULL REFERENCES filings(id),
    from_state          TEXT,
    to_state            TEXT NOT NULL,
    event_kind          TEXT NOT NULL,                  -- transmit | ack | reject | imperfect | manual_override | timeout
    payload             JSONB,                          -- raw ack / reject body (sanitized; no PII)
    actor               TEXT NOT NULL,                  -- system | partner | irs | admin:<id>
    at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX filing_events_filing ON filing_events(filing_id, at);
```

### 8.3 `reject_remediations` (core)
The per-reject remediation track: which user-fix produced which next attempt.

```sql
CREATE TABLE reject_remediations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id           UUID NOT NULL REFERENCES filings(id),
    reject_code         TEXT NOT NULL,
    user_message        TEXT NOT NULL,                   -- the plain-language explanation shown
    fix_actions_taken   JSONB,                           -- structured diff of facts changed
    next_filing_id      UUID REFERENCES filings(id),     -- the new attempt that this remediation produced
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reject_remediations_filing ON reject_remediations(filing_id);
```

---

## 9. Money: Bank Instructions & Payments

### 9.1 `bank_instructions` (core metadata; values vaulted) — resolves review S3
The bank routing/account numbers themselves live in the **vault**. The core table holds the **change-control plane** that v2 §6.4 mandates.

```sql
CREATE TABLE bank_instructions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id                   UUID NOT NULL REFERENCES tax_returns(id),
    purpose                     TEXT NOT NULL,           -- refund_deposit | balance_due_debit
    account_vault_token         UUID NOT NULL,           -- → pii_vault.bank_account
    account_kind                TEXT NOT NULL,           -- checking | savings
    ownership_verified          BOOLEAN NOT NULL DEFAULT FALSE,
    ownership_verified_via      TEXT,                    -- microdeposit | trusted_partner | manual_review
    last_changed_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    change_step_up_at           TIMESTAMPTZ NOT NULL,    -- when WebAuthn step-up was satisfied
    out_of_band_notified_at     TIMESTAMPTZ NOT NULL,    -- when the "did you do this?" notification went out
    cooling_off_until           TIMESTAMPTZ NOT NULL,    -- transmission blocked until this passes
    fraud_review_status         TEXT NOT NULL DEFAULT 'none',  -- none | pending | cleared | blocked
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bank_instructions_return ON bank_instructions(return_id, purpose);

-- VAULT side
CREATE TABLE pii_vault.bank_account (
    token             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routing_enc       BYTEA NOT NULL,
    account_enc       BYTEA NOT NULL,
    account_hash      BYTEA NOT NULL,                    -- HMAC for velocity / fraud checks
    key_version       INTEGER NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX bank_account_hash_uniq ON pii_vault.bank_account(account_hash);
```

> **The hash powers anti-fraud velocity checks** (same account on N returns) without ever decrypting.

### 9.2 `payments` (core)
Filing-fee payments (PSP) and IRS-side balance-due/refund references (IRS-sanctioned ACH). The two flows are deliberately the same shape but distinct `kind`s — they never share a processor (v2 §4.3).

```sql
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    return_id           UUID REFERENCES tax_returns(id),
    kind                TEXT NOT NULL,                  -- filing_fee | balance_due | refund_ref
    amount_cents        BIGINT NOT NULL,
    processor           TEXT NOT NULL,                  -- 'stripe' | 'irs_direct_debit' | 'irs_refund'
    processor_ref       TEXT NOT NULL,
    status              TEXT NOT NULL,                  -- pending|authorized|captured|failed|refunded|settled
    idempotency_key     TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX payments_idempotency ON payments(idempotency_key);
CREATE INDEX payments_user ON payments(user_id, created_at DESC);
```

---

## 10. Trust Artifacts

### 10.1 `consents_signed` (core, **immutable** — §7216, Rev. Proc. 2013-14)
Each separately-signed §7216 consent is its own row. Body is content-addressed by hash; the rendered consent text is stored as a `document`.

```sql
CREATE TABLE consents_signed (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    return_id       UUID REFERENCES tax_returns(id),
    consent_type    TEXT NOT NULL,                       -- 7216_use | 7216_disclosure | tos | privacy | esign_disclosure
    version         TEXT NOT NULL,                       -- 'v3-2025-01' etc.
    body_doc_id     UUID NOT NULL REFERENCES documents(id),
    body_hash       BYTEA NOT NULL,                      -- SHA-256 of the rendered consent text
    accepted        BOOLEAN NOT NULL,
    signed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip              INET NOT NULL,
    user_agent      TEXT,
    CHECK (accepted = TRUE)                              -- we record acceptances; refusals are a different row in audit_logs
);
CREATE INDEX consents_user      ON consents_signed(user_id, consent_type);
CREATE INDEX consents_return    ON consents_signed(return_id);
```

### 10.2 `e_signatures` (core, **immutable**) — resolves S4
The Self-Select PIN e-signature event for a return. The PIN itself is **not persisted** — only the fact that the verification succeeded.

```sql
CREATE TABLE e_signatures (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id                   UUID NOT NULL REFERENCES tax_returns(id),
    signer_person_id            UUID NOT NULL REFERENCES return_people(id),
    method                      TEXT NOT NULL,           -- self_select_pin | spouse_pin
    prior_year_agi_match        BOOLEAN NOT NULL,        -- verified via cf:prior_agi; AGI VALUE NEVER stored here
    prior_year_pin_match        BOOLEAN,                 -- alternative verification
    ip_pin_present              BOOLEAN NOT NULL,        -- did the return carry an IP PIN
    signed_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip                          INET NOT NULL,
    user_agent                  TEXT,
    UNIQUE (return_id, signer_person_id)
);
```

### 10.3 `fraud_review_items` (core)
The queue that holds suspicious returns/payments/bank-changes. Powers the manual-review workflow.

```sql
CREATE TABLE fraud_review_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind                TEXT NOT NULL,                   -- bank_change | high_risk_filing | velocity | sirf_signal | manual
    user_id             UUID REFERENCES users(id),
    return_id           UUID REFERENCES tax_returns(id),
    bank_instruction_id UUID REFERENCES bank_instructions(id),
    signals             JSONB NOT NULL,                  -- structured risk signals (no PII)
    status              TEXT NOT NULL DEFAULT 'pending', -- pending | cleared | blocked | escalated
    decided_by_admin_id UUID,                            -- → admin user id when worked
    decided_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX fraud_review_pending ON fraud_review_items(status, created_at) WHERE status = 'pending';
```

---

## 11. Audit & Admin Access

### 11.1 `audit_logs` (**separate store**, append-only, hash-chained)
The cornerstone of compliance and incident forensics. Full strategy in §15.

```sql
-- IN A SEPARATE PHYSICAL DATABASE / SCHEMA, with role 'audit_writer' (INSERT only)
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    request_id      UUID NOT NULL,                       -- trace id
    actor_kind      TEXT NOT NULL,                       -- user | admin | system | partner | irs
    actor_id        TEXT,                                -- user_id | admin_id | service name
    action          TEXT NOT NULL,                       -- vault.decrypt | return.state_change | facts.edit | doc.upload | admin.access_grant.create | ...
    resource_kind   TEXT NOT NULL,                       -- vault.person_identity | tax_return | document | bank_instruction | ...
    resource_id     TEXT NOT NULL,                       -- token / uuid / object key (NEVER plaintext PII)
    accessed_pii    BOOLEAN NOT NULL,
    purpose         TEXT,                                -- 'file' | 'render_pdf' | 'support_view' | ...
    ip              INET,
    user_agent      TEXT,
    at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    prev_hash       BYTEA NOT NULL,                      -- hash of the previous row's (id || row payload || prev_hash)
    row_hash        BYTEA NOT NULL                       -- hash of this row's canonical serialization
);
CREATE INDEX audit_logs_resource    ON audit_logs(resource_kind, resource_id, at DESC);
CREATE INDEX audit_logs_actor       ON audit_logs(actor_kind, actor_id, at DESC);
CREATE INDEX audit_logs_pii         ON audit_logs(accessed_pii, at DESC) WHERE accessed_pii;
-- Partition by RANGE(at), monthly. Retention: long (§17).
```

> **No PII in audit_logs.** `resource_id` is a token/uuid; `action` is structured; freeform fields are never logged. The redaction discipline is enforced at the writer SDK and tested as security code (v2 §6.6).

### 11.2 `admin_access_grants` (core)
Just-in-time admin/support access; reason-logged; **four-eyes** required for high-risk grants. Every use of a grant produces an `audit_logs` row.

```sql
CREATE TABLE admin_access_grants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id       UUID NOT NULL,
    target_user_id      UUID NOT NULL REFERENCES users(id),
    target_return_id    UUID REFERENCES tax_returns(id),
    scope               TEXT NOT NULL,                   -- view_facts | view_calc | view_document | view_pii (last requires four-eyes)
    reason              TEXT NOT NULL,                   -- support ticket / case ref
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_by         UUID,                            -- second-admin approver (NULL until four-eyes complete)
    approved_at         TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ NOT NULL,            -- short TTL, typically minutes-to-hours
    revoked_at          TIMESTAMPTZ,
    CHECK (scope <> 'view_pii' OR approved_by IS NOT NULL)
);
CREATE INDEX admin_access_grants_active
    ON admin_access_grants(admin_user_id, expires_at)
    WHERE revoked_at IS NULL;
```

---

## 12. Notifications

```sql
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    related_return_id   UUID REFERENCES tax_returns(id),
    channel             TEXT NOT NULL,                   -- email | sms | push | inapp
    template            TEXT NOT NULL,                   -- e.g. 'return_accepted_v1'
    status              TEXT NOT NULL DEFAULT 'queued',  -- queued | sent | failed | suppressed
    sent_at             TIMESTAMPTZ,
    failure_reason      TEXT,
    payload_keys        JSONB,                           -- template merge keys (NEVER raw PII; e.g. {"masked_refund":"$1,2XX"})
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX notifications_inflight ON notifications(status, created_at) WHERE status = 'queued';
-- Partition by RANGE(created_at) monthly.
```

> **Notifications are PII-egress.** No raw refund amount, no last-4 SSN, no bank-info appears in `payload_keys` or rendered templates. Masking is enforced by template lint, not trust.

---

## 13. Relationships & Cardinalities

| Parent → Child | Cardinality | Cascade | Notes |
|---|---|---|---|
| `users` → `tax_returns` | 1 : N | RESTRICT | Returns outlive accounts (retention). |
| `tax_returns` → `tax_returns` (amends) | 1 : N (self) | RESTRICT | Originals are immutable parents of amendments. |
| `tax_returns` → `return_people` | 1 : N | RESTRICT | Removing a person on a draft requires explicit code path. |
| `return_people` → `pii_vault.person_identity` | N : 1 | n/a | Cross-store reference by token. |
| `tax_returns` → `income_sources` / `deductions_claimed` / `credits_claimed` | 1 : N | CASCADE on return delete (only on hard-delete after retention) | Soft-delete leaves them. |
| `tax_returns` → `tax_calculations` | 1 : N | RESTRICT | Calculations are append-only history. |
| `tax_calculations` → `form_line_values` | 1 : N (~100–300) | RESTRICT | The single source of truth. |
| `tax_calculations` → `calculation_trace` | 1 : 1 | RESTRICT | |
| `users` → `carryforwards` | 1 : N | RESTRICT | Multi-year; never hard-delete. |
| `carryforwards` → `tax_returns` (supersession) | N : 1 | RESTRICT | An amendment supersedes prior carryforwards. |
| `tax_returns` → `filings` | 1 : N | RESTRICT | One per (return, jurisdiction, attempt). |
| `filings` → `filing_events` | 1 : N | RESTRICT | Append-only. |
| `filings` → `reject_remediations` | 1 : N | RESTRICT | |
| `tax_returns` → `bank_instructions` | 1 : N | RESTRICT | Versioned by insert (no UPDATE of routing/account; create new). |
| `bank_instructions` → `pii_vault.bank_account` | N : 1 | n/a | Cross-store. |
| `users` → `payments` | 1 : N | RESTRICT | |
| `tax_returns` → `consents_signed` | 1 : N | RESTRICT | Per-consent rows. |
| `tax_returns` → `e_signatures` | 1 : 1..2 (taxpayer ± spouse) | RESTRICT | |
| `tax_returns` → `fraud_review_items` | 1 : N | RESTRICT | |
| `users` → `notifications` | 1 : N | RESTRICT | |
| `users` → `admin_access_grants` | 1 : N (as target) | RESTRICT | |
| (cross-store) `audit_logs` references everything by id/token | append-only | n/a | Separate store. |

**Cross-store integrity** (core ↔ vault, core ↔ object storage) is enforced **in application code**, not by FKs (you can't FK across databases). The integrity tests in CI verify dangling-token detection.

---

## 14. Indexing & Partitioning Strategy

### 14.1 Primary access patterns (the "hot reads")
1. **User dashboard:** `SELECT … FROM tax_returns WHERE user_id = ? ORDER BY tax_year DESC` → `INDEX(user_id, tax_year)`.
2. **Live estimate fetch:** "latest calc for return" → `INDEX(tax_calculations(return_id, computed_at DESC))`.
3. **Form-line lookup for renderer/serializer:** PK `(calculation_id, form_id, line_id)` covers it.
4. **Filing ops:** "in-flight filings" → partial `INDEX(filings(state, transmitted_at)) WHERE state IN ('transmitted','received','validated')`.
5. **Active carryforwards for next year's engine:** partial `INDEX(carryforwards(user_id, tax_year, type)) WHERE superseded_at IS NULL`.
6. **Audit lookup by resource:** `INDEX(audit_logs(resource_kind, resource_id, at DESC))`.
7. **Fraud queue:** partial `INDEX(fraud_review_items(status, created_at)) WHERE status='pending'`.

### 14.2 Partitioning (the seasonal & multi-year shape)

| Table | Partition strategy | Rationale |
|---|---|---|
| `tax_returns` | LIST by `tax_year` | Year is the natural slice; allows cold-year archival. |
| `tax_calculations` | LIST by `tax_year` (parent), HASH by `return_id` (child) | Current-year is hot; user-distributed hash spreads writes (resolves SC4). |
| `form_line_values` | Inherits parent's partition (via `tax_year` propagation) | Co-locate with their calculation. |
| `audit_logs` | RANGE by `at` (monthly) | Retention by drop-partition; large volume; time-windowed queries. |
| `notifications` | RANGE by `created_at` (monthly) | Same. |
| `filing_events` | RANGE by `at` (monthly) | Same. |
| `income_sources`, `deductions_claimed`, `credits_claimed` | LIST by parent `tax_year` (via materialized column) | Year locality. |
| `carryforwards` | LIST by `tax_year` | Year locality; active-view partial index. |

### 14.3 Sharding the *hot* current year (resolves SC4)
LIST-by-year alone leaves the current-year partition pulling all of season's load. v2 §8.3 specifies **hashing the current-year working set by `user_id`** — implemented as **sub-partitioning** the current-year partition by HASH(`user_id`) (8–16 sub-partitions to start). Prior-year partitions are not hash-sharded (cold).

### 14.4 Anti-patterns to forbid in CI
- ❌ Any `SELECT` against `audit_logs` without an actor- or resource-bounded predicate (full scan = ops incident).
- ❌ Any index on a column that could contain SSN/account/IP-PIN material (these don't exist in core anyway — index review enforces it).
- ❌ Triggers that perform tax math. The engine lives in the engine.

---

## 15. Audit Logging Strategy

### 15.1 What is logged
| Event | Why |
|---|---|
| **Every vault decryption** (SSN/TIN/IP-PIN/bank) | Compliance + breach forensics. Audited **before** plaintext is returned. |
| Every `tax_returns.state` transition | The return's legal lifecycle. |
| Every facts edit (`income_sources`, `deductions_claimed`, `credits_claimed`, `return_facts_misc`) | "What did the user say, and when?" before snapshot. |
| Every document upload / read / deletion | Document custody. |
| Every `bank_instructions` change + step-up + ownership-verify | Refund-redirection control plane. |
| Every consent acceptance/refusal | §7216 & legal. |
| Every e-signature event | Filing legitimacy. |
| Every filing state transition | Submission lifecycle. |
| Every admin access grant creation, approval, use, revocation | Insider-risk surface. |
| Every payment authorization/capture | Financial trail. |
| Every IR-relevant alert (engine non-convergence, reject-rate spike, anomaly) | Forensics. |

### 15.2 Tamper-evidence: the hash chain
Each row carries `row_hash = SHA256(canonical_serialization)` and `prev_hash = previous row's row_hash`. A periodic verifier walks the chain and alerts on the first break.

```
row_hash_n = SHA256( canonical( id, request_id, actor_*, action, resource_*, accessed_pii,
                                  purpose, ip, user_agent, at ) || prev_hash_n )
prev_hash_n = row_hash_{n-1}
```

- **Verifier** runs nightly + on-demand; persists a *signed* "last verified row" anchor to an offline / external WORM (so even a root-DB compromise leaves evidence in the anchor record).
- **Inserts only.** The DB role granted to audit writers is `INSERT`-only; `UPDATE`/`DELETE` are revoked. Schema migrations on the audit DB require a separate change-window and two-person review.

### 15.3 PII redaction posture
- **No raw PII fields exist on `audit_logs`.** `resource_id` is a token/uuid. `action` is structured. `purpose` is an enum.
- The **writer SDK** has a redaction filter as security-critical code with explicit unit tests (any string matching SSN/account patterns triggers a test failure and a writer panic in dev).
- Even **error messages** logged to the audit stream are template-only — never `Error: "%s"` substitution.

### 15.4 Retention
- **7 years** as a working floor for return-related audit events; extended to **full statutory retention** for filing events and consents.
- Implemented by monthly partition drop *after* the retention window has elapsed *and* the verifier has confirmed chain integrity.
- Audit-log deletion is itself an audited operation (separate, smaller "meta-audit").

### 15.5 What `audit_logs` is **not**
It is **not** the analytics pipeline. It is **not** the application log. It is the **legal-forensic trail** of who touched what. Application debugging logs live in the observability stack (separate, PII-scrubbed, shorter retention).

---

## 16. Tax Return Versioning

Versioning is **multi-dimensional** — five things version, in different ways:

### 16.1 The return *state* — a mutable lifecycle
```
draft ─▶ ready_to_review ─▶ ready_to_file ─▶ signed ─▶ submitted ─▶ accepted
                                                 │                       │
                                                 │                       ▼
                                                 │                   amended (new tax_returns row)
                                                 ▼
                                              rejected ─▶ (remediate) ─▶ signed ─▶ submitted ─▶ ...
```
- `tax_returns.state` mutates; transitions emit `audit_logs` rows.
- A return is **frozen at `submitted`**: no further facts/edits change the snapshot for this attempt; subsequent fixes either go through the reject-remediation loop (which creates a **new** `filings` row) or, post-acceptance, an **amendment** (a new `tax_returns` row of `kind='amendment'`).

### 16.2 Facts — mutable in draft, *snapshotted* at submission
- During draft, `income_sources`/`deductions_claimed`/`credits_claimed`/`return_facts_misc` are mutable. Each edit is an `audit_logs` event.
- At the `signed → submitted` transition, the facts are **serialized into a snapshot** and that snapshot's hash becomes `tax_calculations.inputs_hash`. The submitted MeF payload and PDF are derived from that snapshot.
- Post-submission, **fact tables are not deleted** but no edits are permitted on the submitted return (enforced by application + a row-level `state IN ('draft','rejected')` predicate on UPDATE).

### 16.3 Calculations — immutable, append-only
- One row per engine invocation. The latest is the "current estimate"; the one referenced by `filings.calculation_id` is the **filed** calculation, kept forever.
- Older non-submitted calculations are **eligible for compaction** (drop their `form_line_values` rows) after a retention window (default: keep last 10 per return for explainability + the submitted one forever). The summary columns on `tax_calculations` stay regardless, so the calc history line graph (refund estimate over time) is preserved cheaply.

### 16.4 Form-line values — frozen per calculation
- A `(calculation_id, form_id, line_id)` value is **never** updated. A "correction" is a *new* calculation with new values.
- This guarantees that the PDF/MeF derived from a calculation **never diverges** from the calc itself (resolves review A4 at the data layer).

### 16.5 Amendments — a new return, not an edit
- An amendment of TY2024 creates `tax_returns (kind='amendment', amends_return_id=<original>)`.
- The amendment has its **own** facts (which may be initialized as a copy of the original's submitted snapshot, with diffs), its **own** calculations, its **own** form-line values, and its **own** `filings` (Form 1040-X has its own MeF flow).
- The original return's snapshot is **never mutated.** This is what gives "the IRS came asking three years later" a clean answer.

### 16.6 Carryforwards — append-only with supersession + forward cascade
- When the engine emits next-year carryforwards from a filed return, rows are **inserted** with `source_return_id` set.
- If the source return is later **amended**, the new amendment-emitted carryforwards are inserted and the *old* rows have `superseded_by_return_id` and `superseded_at` populated.
- **Forward cascade:** any *already-filed* later year that consumed the now-superseded carryforward is flagged for review by an "amendment cascade" job: the user is notified that prior years' filings may need amendment, and the affected later returns are listed in their dashboard. This is a *workflow* on top of the schema, but the data shape makes it tractable.

### 16.7 Idempotency & reconciliation, applied to filing
- The pre-transmit gate re-runs the engine→PDF→MeF reconciliation diff against the *outgoing* MeF payload (v2 §7.3). Mismatch sets `filings.state` back, raises an alert, and **prevents** transmission. This is a *data-level* invariant, enforced by code, validated in CI on every release.

### 16.8 Recoverability
Because filed snapshots, calculations, form-line values, MeF payloads, and filed PDFs are all immutable artifacts, a "what did we file for user X in TY2024?" question is answered by a single query across `tax_returns → filings (state=accepted) → tax_calculations → form_line_values + documents(kind='filed_return_pdf','mef_payload')`. **Forensic reproduction is a read, not a rebuild.**

---

## 17. Retention, Deletion, Crypto-Shredding

### 17.1 Retention table
| Data | Retention | Mechanism |
|---|---|---|
| Filed-return artifacts (calc, form-line values, MeF payload, filed PDF, e-signature, consents) | **Full statutory window** (commonly 7+ years; longer for fraud / open audit) | Object Lock (WORM) + insert-only DB tables |
| In-progress drafts / abandoned returns | 18 months from last activity | Soft-delete at 12 months; purge at 18 |
| Uploaded source documents (W-2/1099/1095-A images) | Statutory window when attached to a filed return; 18 months otherwise | As above |
| Vault person/bank rows | **As long as referenced** by any non-purged return + retention window | Reference-counted; crypto-shred when count hits zero AND window elapsed |
| Audit logs | 7 years floor; statutory for filing-related events | Monthly partition drop after verifier confirms chain |
| Notifications | 25 months | Monthly partition drop |
| Fraud review items | 7 years | Time-based purge |

### 17.2 Right-to-delete vs. mandatory retention (S6)
- User deletion requests are honored **only to the extent law permits**. The retention floor for filed-return data overrides "delete everything."
- The mechanism is **crypto-shredding** for the vault: deleting the per-record data key renders the encrypted blob unreadable, satisfying "deleted" while leaving the encrypted-but-now-undecipherable record in place for the statutory window. Core-DB rows tied to that vault token become unviewable for PII purposes.
- The user-facing surface explains what is/isn't deletable and why (a trust feature, not a legal dodge).

### 17.3 Backups
- All five stores have automated, encrypted backups with PITR.
- Vault backups use the **vault's** key hierarchy (not the core's) — a core-DB backup leak does not yield SSNs.
- Restore testing is calendared **before** each filing season.

---

## 18. Schema Evolution Discipline

Tax law changes annually and mid-season; the schema must evolve safely on a live, regulated system.

- **All migrations expand-then-contract.** Add new columns/tables nullable → backfill → switch reads → switch writes → drop the old. Never a `DROP COLUMN` followed by deploy.
- **No destructive migrations during filing season** (Jan 15 – Apr 30, Oct 1 – Oct 20) without explicit ops-on-call sign-off and a rollback plan.
- **Ruleset/engine version is stored on the return and the calculation.** Schema changes for a new tax year are *additive* (new ruleset, new form/line nodes); prior-year computations remain valid against their own ruleset.
- **Audit DB migrations** require two-person review and a separate change window; integrity verifier must pass before and after.
- **Data backfills touching PII** are submitted as one-off, approved scripts with their own audit trail (each backfill is an admin action).

---

## 19. Open Questions / Out of Scope

- **EIN treatment.** Employer EINs are partly public, partly sensitive; current draft holds them in core. May promote to vault if the threat model warrants.
- **Spouse vault sharing.** Both spouses on an MFJ return get their own `person_identity` rows; whether a user can "see" a spouse's SSN ever (vs. only system services) is a UX decision deferred to product.
- **Multi-state coupling.** The schema supports per-jurisdiction `filings` but the *engine's* multi-state dependency graph (credit-for-taxes-paid-to-other-states) is out of scope for this document; tracked under v2 §7.4.
- **Brokerage 1099-B lot storage.** When investor support arrives (v2 §9 / A6), lots will be a new sub-table under `income_sources` keyed by `type='1099_b'`; volume is large enough that hash-sub-partitioning will be needed from day one.
- **Refund Transfer.** Deferred per v2 §9; would add a sub-schema for bank-product accounts and disbursement events, all in their own compliance scope.

---

*This is engineering judgment, not legal/tax advice. Retention windows, audit obligations, and §7216/Safeguards specifics must be confirmed with qualified tax counsel and an IRS e-file specialist before any handling of real taxpayer data. DDL is illustrative; production migrations must be reviewed against the schema-evolution discipline in §18.*
