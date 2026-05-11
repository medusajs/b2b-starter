# Procurement Platform — Place Phase Migration (Slice 1)

**Status:** Approved design — ready for implementation planning
**Date:** 2026-05-11
**Author:** Olayemi Ibrahim (with Claude collaboration)
**Supersedes:** N/A (first spec in this initiative)
**Related:** stealth `docs/adr/0001` through `0009`

## 0. Context

Lagos International Market currently runs its commerce and procurement workflows in **Notion**. Notion is the only operational system today. Three code projects exist in parallel as in-development attempts at a future platform — none is in Yemi's daily use:

- **Notion Operations Home** *(operational, daily use)* — vendor profiles, PO database, invoice tracker, recurring obligations, reconciliation log, financial exceptions; QBO bills/payments mirrored read-only. This is the platform's current production state.
- **`b2b-starter`** *(in development)* — a Medusa.js v2 monorepo with the official B2B starter (Company / Quote / Approval modules) plus a Next.js storefront. The intended platform foundation; not yet hosting any LIM workflows.
- **`catalog-health-worker`** *(in development)* — a Vercel Workflow DevKit service that runs a daily AI scan over the Toast POS catalog (~1,840 items) and writes findings to Notion. Functionally complete and runnable, but not yet adopted as the source of truth for catalog issues.
- **`stealth`** *(in development)* — a recent (5 commits, May 2026) Temporal-driven procurement platform with a complete domain model: 14 tables, 17 enums, three-phase Place/Receive/Pay state machines, and 11 AI agent capabilities. Design-mature; no operational data has flowed through it.

The directive is to consolidate the three in-development projects into one platform using **Medusa primitives for data + transactional commits**, with stealth's agent layer as the orchestration brain — then cut Notion over to it once it can replace the operational workflows. This spec covers the **first slice** of that consolidation: migrating stealth's **Place phase** design into Medusa end-to-end, including the schema, workflows, agent integration, and admin UI for everything required to draft, send, and confirm a Purchase Order.

Receive, Pay, QBO sync, catalog-health integration, and storefront work are explicit follow-on slices, not in scope here.

## 1. Goals

1. **Medusa is the single source of truth** for procurement data — vendors, items, purchase orders, line items, events, files, inbound/outbound messages. The agent never writes directly to any other database; stealth's Drizzle/Supabase schema is not carried into the merged platform (its design is, via Medusa modules).
2. **Stealth's Temporal agent layer** is preserved as a peer service that calls into Medusa for all state changes. Its 9 ADRs, its capability prompts/schemas/tools, and its three-phase FSM design carry over.
3. **An end-to-end vertical works**: an inbound email arrives → the inbound-classifier capability identifies it → the place-drafting capability drafts a PO → the PO appears in Medusa admin in Draft state → a human reviews and approves → mark-PO-sent runs → an outbound email goes to the vendor → vendor confirms → mark-PO-confirmed runs. Every transition is durable, observable in Langfuse, and recorded as a Medusa `procurementEvent`.
4. **The catalog ETL** (stealth Issue 02) is re-runnable against the Medusa schema, seeding `item` and `vendorItem` from historical POs.
5. **The repo structure** accommodates future slices without restructuring: Receive (Slice 2), Pay + QBO (Slice 3), Catalog Health integration (Slice 4), Wholesale storefront (Slice 5+).

## 2. Non-goals

The following are **explicitly out of scope** for this slice and will be addressed in subsequent specs:

- **Receive phase** — receipts, dock photos, count recording, "assumed full" defaults, variance handling.
- **Pay phase** — bills, bill-line-items, credit memos, payments, reconciliation, financial exceptions, recurring obligations.
- **QBO sync** — bills, bill payments, purchases, vendor mirror, chart of accounts.
- **Melio integration** — bill payment execution.
- **Catalog-health-worker integration** — the Vercel worker continues writing to Notion until Slice 4 redirects it to a Medusa `catalogHealth` module.
- **Wholesale / B2B online store** — Medusa `Product` as a projection of `item`, B2B price books, MOQ, case-pack rules.
- **Restaurant menu** — deferred indefinitely.
- **Migrating the existing Notion PO database** — Notion stays the operational store until this slice is shipped and validated; cutover is a deliberate post-Slice-1 step covered in §11.

## 3. Architecture

### 3.1 Layered model

```
┌──────────────────────────────────────────────────────────────────┐
│ External channels: email / SMS / WhatsApp / Slack / voice /      │
│                    manual entry / photo upload                   │
└────────────────────┬─────────────────────────────────────────────┘
                     │ webhooks / IMAP polls / form posts
┌────────────────────▼─────────────────────────────────────────────┐
│ messaging service (apps/messaging/)                              │
│   Node + Fastify + Drizzle. Own data layer.                      │
│                                                                  │
│   Channel adapters (own auth, retry, rate-limit):                │
│     email (IMAP/SMTP/Gmail API), sms (Twilio), whatsapp          │
│     (Meta Cloud API), slack (Events API), voice, manual          │
│                                                                  │
│   Data: ChannelAccount, MessageThread, InboundMessage,           │
│         OutboundMessage. Opaque vendor_id / po_id text refs.     │
│                                                                  │
│   API: POST /inbound, /outbound, /outbound/:id/send, etc.        │
│   Events: publishes `message.received` / `message.sent` to       │
│           shared Redis stream                                    │
└────────────────────┬─────────────────────────────────────────────┘
                     │ subscribes to message events; calls API
┌────────────────────▼─────────────────────────────────────────────┐
│ procurement-agent (apps/procurement-agent/)                      │
│   Temporal worker process                                        │
│                                                                  │
│   Parent workflow per PO (long-running, durable, weeks)          │
│   ├── Place child workflow (this slice)                          │
│   ├── Receive child workflow  (Slice 2)                          │
│   └── Pay child workflow      (Slice 3)                          │
│                                                                  │
│   Activities = AI capabilities (LLM via AI Gateway):             │
│     place-drafting, vendor-match, inbound-classifier,            │
│     outbound-classifier, slack-intent                            │
│                                                                  │
│   Each activity's write phase calls EITHER messaging service     │
│   (for message ops: classify, mark-sent) OR Medusa workflows     │
│   (for PO ops: createPODraft, markPOSent).                       │
└──────────┬───────────────────────────────────────┬───────────────┘
           │ Medusa admin SDK                      │ messaging API
           ▼                                       ▼
┌─────────────────────────────────┐  ┌─────────────────────────────┐
│ Medusa backend (apps/backend/)  │  │ messaging service           │
│                                 │  │ (same service as top)       │
│ Workflows: createPODraft,       │  │                             │
│   markPOSent, attachFileToPO,   │  │                             │
│   linkMessageToPO, ...          │  │                             │
│                                 │  │                             │
│ Modules: vendor, item,          │  │                             │
│   purchaseOrder,                │  │                             │
│   procurementEvent,             │  │                             │
│   procurementFile               │  │                             │
│                                 │  │                             │
│ Index Module for cross-module   │  │                             │
│ filtering                       │  │                             │
└──────────┬──────────────────────┘  └─────────────────────────────┘
           │                                       ▲
           ▼                                       │ widget calls
┌──────────────────────────────────────────────────┴──────────────┐
│ Medusa admin UI (apps/backend/src/admin/)                       │
│                                                                 │
│   Vendor list/detail, PO list/detail with event timeline +      │
│   files, Inbox widget that fetches from messaging service       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Why this split

- **Medusa workflows run to completion.** A real PO spans days to weeks across phases (vendor takes 3 days to confirm; bill arrives 5 days after delivery). Medusa cannot suspend mid-workflow waiting for an external signal. Temporal can, durably, for weeks.
- **Temporal activities are the right wrapper for AI capabilities** — retryable, replayable, individually traceable in Langfuse. This is the pattern stealth already validated.
- **Medusa workflows are the right wrapper for transactional commits** — atomic, type-safe, compensation-backed, isolated per module. One activity can call multiple Medusa workflows; each workflow stays small and focused.
- **Modules give isolation and admin UI for free.** Medusa's admin auto-generates list/detail pages from module schema; we extend with custom widgets where stealth's domain (event timeline, placeholder warnings, tone references) needs richer UI.
- **Messaging is a separate service, not a Medusa module.** Messaging is generic communications infrastructure — it isn't commerce-specific. Channel adapters (IMAP, Twilio, WhatsApp, Slack Events) want their own service surface with their own auth/webhook/retry semantics. Hosting them as Medusa subscribers would be awkward. Future consumers (customer support, internal ops) reuse the same service. See §16 for full design.

### 3.3 ADR carry-over from stealth

The 9 stealth ADRs are preserved verbatim under `docs/adr/`:

| ADR | Title | Status under merge |
|---|---|---|
| 0001 | Three coupled FSMs | Preserved — encoded as state enums on `purchaseOrder` module |
| 0002 | Runtime stack | Amended — Medusa replaces Next/Drizzle for data; Temporal/Supabase/AI Gateway/Langfuse retained for agent layer |
| 0003 | System observes pattern | Preserved — every Medusa workflow emits `procurementEvent` |
| 0004 | Auto-fire with downstream gates | Preserved — capabilities auto-fire; gates live in Medusa workflows |
| 0005 | QBO as payment source of truth | Preserved — relevant to Slice 3 |
| 0006 | Seeded item catalog | Preserved — ETL re-runs against Medusa |
| 0007 | Workflow-driven agentic architecture | Preserved — Temporal owns workflows, Medusa owns data |
| 0008 | Model selection matrix | Preserved — unchanged |
| 0009 | Pinned tone references | Preserved — `vendor.tone_reference_email_id` becomes a field on Medusa `vendor` module |

A new **ADR 0010 — Medusa as data layer, Temporal as orchestration** is written as part of this slice's implementation to record the merge decision.

## 4. Repository layout

```
b2b-starter/ (turborepo root, current name kept for now)
├── apps/
│   ├── backend/                  # Medusa.js v2 — existing, extended
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── company/, quote/, approval/  # existing B2B starter
│   │   │   │   ├── vendor/                # NEW
│   │   │   │   ├── item/                  # NEW
│   │   │   │   ├── purchaseOrder/         # NEW
│   │   │   │   ├── procurementEvent/      # NEW
│   │   │   │   └── procurementFile/       # NEW
│   │   │   ├── workflows/
│   │   │   │   ├── company/, quote/, approval/  # existing
│   │   │   │   ├── vendor/, item/, purchaseOrder/    # NEW
│   │   │   │   ├── procurementEvent/      # NEW
│   │   │   │   └── messageRef/            # NEW — workflows that record opaque message-id refs from the messaging service
│   │   │   ├── links/                     # NEW links for procurement modules
│   │   │   ├── admin/                     # NEW Vendor/PO pages + Inbox widget that calls messaging API
│   │   │   └── api/
│   │   │       └── admin/                 # NEW routes consumed by the agent
│   │   └── medusa-config.ts               # extended: register procurement modules + Index Module
│   ├── storefront/                        # untouched in this slice
│   ├── messaging/                         # NEW — see §16 for full design
│   │   ├── src/
│   │   │   ├── api/                       # Fastify (or Hono) HTTP routes
│   │   │   ├── db/                        # Drizzle schema + client
│   │   │   ├── adapters/                  # channel-specific ingestion + send
│   │   │   │   ├── _shared/
│   │   │   │   ├── email/                 # IMAP/SMTP/Gmail
│   │   │   │   ├── sms/                   # Twilio
│   │   │   │   ├── whatsapp/              # Meta Cloud API
│   │   │   │   ├── slack/                 # Events API
│   │   │   │   ├── voice/                 # transcript ingestion
│   │   │   │   └── manual/                # form-based entry
│   │   │   ├── ingestion/                 # webhook routes + IMAP poller
│   │   │   ├── events/                    # publisher (Redis stream)
│   │   │   └── server.ts
│   │   ├── drizzle/                       # migrations
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── procurement-agent/                 # NEW
│       ├── src/
│       │   ├── workflows/                 # Temporal parent + Place child
│       │   ├── activities/                # capability wrappers
│       │   ├── agents/                    # imported from stealth
│       │   │   ├── _shared/
│       │   │   ├── place-drafting/
│       │   │   ├── vendor-match/
│       │   │   ├── inbound-classifier/
│       │   │   ├── outbound-classifier/
│       │   │   └── slack-intent/
│       │   ├── clients/
│       │   │   ├── medusa-sdk.ts          # Medusa admin SDK
│       │   │   └── messaging-client.ts    # typed client for messaging service
│       │   ├── subscribers/
│       │   │   └── message-received.ts    # consumes Redis stream from messaging
│       │   ├── worker.ts                  # Temporal worker entrypoint
│       │   └── lib/                       # AI Gateway, Langfuse, prompt utilities
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared-types/                      # NEW — cross-app TS types
│   │   ├── procurement.ts                 # Vendor, Item, PO, Event types
│   │   ├── messaging.ts                   # Message, Thread, ChannelAccount types
│   │   └── package.json
│   └── (existing packages, if any)
├── docs/
│   ├── adr/                               # NEW — 9 ADRs from stealth + ADR 0010 + ADR 0011
│   ├── agents/                            # existing
│   └── superpowers/specs/                 # this spec lives here
├── turbo.json                             # extended: messaging + procurement-agent in pipeline
├── pnpm-workspace.yaml                    # extended: messaging + procurement-agent + shared-types
└── (rest of existing root)
```

## 5. Medusa modules

Each module follows the standard Medusa pattern: `src/modules/<name>/{models/, service.ts, index.ts, migrations/}`. Module names are camelCase per Medusa convention.

### 5.1 `vendor`

**Entities:**

- `Vendor` — id (uuid), name (unique), legal_name (nullable), payment_terms (enum: `net_15` / `net_30` / `net_45` / `net_60` / `prepay` / `cod`), net_starts_from (enum: `invoice_date` / `ship_date`), primary_order_email, ap_email (nullable), notes, tone_reference_message_id (`model.text()`, nullable — opaque reference to a message in the messaging service; Medusa does not link it because the messaging service owns the data).
- `VendorContact` — id, vendor_id (FK), name, role, email, phone.
- `OrderingInstruction` — id, vendor_id (FK), instruction_text, cutoff_time (nullable), order_days (text[], nullable).

**Service:** auto-generated CRUD via `MedusaService({ Vendor, VendorContact, OrderingInstruction })`.

### 5.2 `item`

**Entities:**

- `Item` — id, canonical_name, description (nullable), default_unit (e.g., "case", "lb", "ea"), category (nullable string; refined when catalog-health module exists), is_active.
- `VendorItem` — id, item_id (FK, same module), vendor_id (`model.text()` — Medusa modules cannot hold cross-module DB-level FKs; the link in §5.7 carries the relationship), vendor_sku, vendor_description, last_unit_price (numeric), last_ordered_date (date, nullable), default_order_qty (int, nullable), lead_time_days (int, nullable).

**Service:** standard `MedusaService({ Item, VendorItem })`.

### 5.3 `purchaseOrder`

**Entities:**

- `PurchaseOrder` — id, po_number (human-readable, format `LIM-YYYY-NNNN`, unique), vendor_id (FK via link), place_status (enum: `draft` / `awaiting_payment` / `sent` / `needs_review` / `confirmed` / `cancelled`), expected_delivery (date, nullable), notes (nullable), drafted_by_capability (text, nullable — records which agent drafted, if any), placeholder_count (int, computed at write time — number of unresolved `[NEEDS X]` fields).
- `POLineItem` — id, purchase_order_id (FK, same module), line_number (int), item_id (FK via link, nullable for free-text lines), description, quantity (numeric), unit (text), unit_price (numeric), line_total (computed).
- `POSnapshot` — id, purchase_order_id (FK), snapshot_taken_at (timestamp), reason (text — e.g., `po_sent`), payload (jsonb — full PO + lines at snapshot time).

**Service:** standard CRUD plus a thin `computePlaceholders(po)` helper used by workflows.

### 5.4 `procurementEvent`

**Entities:**

- `Event` — id, purchase_order_id (FK via link), event_type (text — e.g., `po_drafted`, `po_sent`, `file_attached`, `vendor_chased`, `placeholder_resolved`), source (enum: `human` / `agent` / `vendor` / `system`), source_detail (text, nullable — e.g., `assumed_full`, `place-drafting@0.1.2`), phase (enum: `place` / `receive` / `pay` / `cross`), is_transitional (boolean — true if event drives a state change), payload (jsonb), occurred_at (timestamp), recorded_by (text — user_id or system identifier).

Service-level invariant: events are append-only. No update workflow exists for `Event`.

### 5.5 Messaging (deferred to a peer service)

Messaging — inbound and outbound communications across email / SMS / WhatsApp / Slack / voice / manual / photo — **does not live inside Medusa.** It runs as a separate Node service at `apps/messaging/` with its own Drizzle schema, channel adapters, and HTTP API. Medusa procurement entities reference messages by opaque text IDs (`vendor.tone_reference_message_id`, `procurementEvent.payload.message_id`, links via the `messageRef` workflows in §6.1).

See **§16 — Messaging service** for the full design (entities, adapters, API, event publishing, Medusa admin integration).

### 5.6 `procurementFile`

**Entities:**

- `File` — id, sha256 (unique), original_name, mime_type, size_bytes, storage_path (S3/Supabase Storage), file_type (enum: `po_sent` / `po_attachment` / `inbound_email` / `outbound_email` / `vendor_confirmation` / `bill` / `credit_memo` / `packing_slip` / `bol` / `dock_photo` / `damage_photo` / `remittance` / `other`), direction (enum: `inbound` / `outbound` / `na`), uploaded_by (enum: `human` / `agent` / `system` / `inbound_email`), uploaded_at.

Dedup is enforced at the workflow layer: `attachFileToPOWorkflow` checks for an existing File by SHA256 and reuses it.

### 5.7 Module links

Every link is its own file in `apps/backend/src/links/`. All links include `filterable` properties for the Index Module.

| Link file | Modules | Notes |
|---|---|---|
| `vendor-purchase-order.ts` | `vendor` ↔ `purchaseOrder` | One vendor → many POs. `filterable: ["id", "name"]` on vendor side. |
| `vendor-vendor-item.ts` | `vendor` ↔ `item.VendorItem` | The `VendorItem` model lives in `item` module and holds per-(vendor, item) data (sku, last price, lead time). This link binds each VendorItem to its Vendor. `filterable: ["id", "name"]` on vendor side so the UI can filter VendorItems by vendor name. |
| `item-vendor-item.ts` | `item` ↔ `item.VendorItem` | Same-module relation; expressed as a normal Mikro relationship via `item_id`, not via `defineLink`. Listed here for completeness — not a separate link file. |
| `purchase-order-event.ts` | `purchaseOrder` ↔ `procurementEvent` | One-to-many; `filterable: ["id", "event_type", "phase"]` on event side for timeline queries. |
| `purchase-order-file.ts` | `purchaseOrder` ↔ `procurementFile` | One-to-many; `filterable: ["id", "file_type"]`. |
| *(no messaging links)* | — | Messages live in the messaging service (§16). Medusa stores opaque message IDs on `vendor.tone_reference_message_id`, `outboundMessageRef.purchase_order_id`, and `procurementEvent.payload.message_id`. Cross-system joins happen in the agent or in admin widgets that call both APIs. |
| `item-line-item.ts` | `item` ↔ `purchaseOrder.POLineItem` | Lines that match a canonical item. Free-text lines have no link. |

Index Module setup is a one-time foundation step at the start of implementation:

1. `pnpm add @medusajs/index` in `apps/backend`
2. Add to `medusa-config.ts`
3. Set `MEDUSA_FF_INDEX_ENGINE=true` in `.env` and `.env.template`
4. Run `npx medusa db:migrate` after all link files exist

## 6. Medusa workflows (Place phase)

All workflows live in `apps/backend/src/workflows/`. Each is composed of steps from `apps/backend/src/workflows/steps/`. Every workflow that mutates state also calls `recordEventStep` as a final step before returning, so the event log is always in sync with the data.

### 6.1 Inventory of Place-phase workflows

| Workflow | Purpose | Compensation |
|---|---|---|
| `createVendorWorkflow` | Create Vendor + initial contacts + ordering instructions atomically | Delete vendor + contacts + instructions |
| `updateVendorWorkflow` | Update vendor profile fields | Restore previous values from input snapshot |
| `setVendorToneReferenceWorkflow` | Pin a specific `IncomingEmail` as the tone reference | Clear or restore previous tone_reference_email_id |
| `createItemWorkflow` | Create canonical Item | Delete item |
| `createVendorItemWorkflow` | Create or update VendorItem (upsert by `vendor_id + vendor_sku`) | Restore previous VendorItem state |
| `linkInboundMessageToPOWorkflow` | Record that an inbound message (by opaque ID, owned by messaging service) is associated with a PO. Emits `inbound_message_linked` event. | Remove the reference; emit reversal event |
| `linkOutboundMessageToPOWorkflow` | Record that an outbound message draft is associated with a PO. | Remove the reference |
| `setVendorToneReferenceWorkflow` | Set `vendor.tone_reference_message_id` to an opaque message ID. The workflow does NOT validate the message exists in messaging service (avoiding cross-service tight-coupling); the admin UI does that validation before invoking. | Restore previous value |
| `attachFileToPOWorkflow` | Dedup by SHA256, attach to PO, emit `file_attached` event | Detach link; do not delete file (other POs may reference) |
| `createPODraftWorkflow` | Atomically: create PO header + line items + initial `po_drafted` event | Cascade delete PO + lines + events for this PO |
| `editPODraftWorkflow` | Edit line items / header on a Draft PO (state=`draft` only) | Restore previous header + lines from snapshot input |
| `resolvePlaceholderWorkflow` | Mark a placeholder field resolved (e.g., a `[NEEDS PRICE]` filled in) | Restore previous field value + placeholder marker |
| `markPOSentWorkflow` | Validates: zero placeholders. Writes `POSnapshot`. Sets state → `sent`. Emits `po_sent` event. | Revert state → `draft`, delete snapshot |
| `markPONeedsReviewWorkflow` | Sets state → `needs_review` (vendor change requires owner attention) | Revert state |
| `markPOConfirmedWorkflow` | Sets state → `confirmed` | Revert state |
| `markPOCancelledWorkflow` | Sets state → `cancelled` (terminal). Emits cancellation event. | Revert state (only valid as compensation; cancellation is otherwise terminal) |
| `softDeleteVendorWorkflow` | Soft-delete a Vendor. Fails if any non-terminal POs reference it. | Restore via `restoreVendors` |

### 6.2 Workflow constraint reminders

Per Medusa conventions documented in `medusa-dev:building-with-medusa`:

- Composition functions are synchronous, not async, not arrow functions.
- No conditionals (`if`/`else`), ternaries, optional chaining, spread, or loops in composition.
- Use `transform()` for any dynamic value derivation.
- Use `when()` for conditional step execution.
- One mutation per step; use `.config({ name })` to disambiguate repeated step calls.
- Workflows are required for ALL mutations; routes never touch services directly.

### 6.3 Idempotency for agent-driven workflows

Every workflow callable by the agent layer must be idempotent. Implementation pattern: the agent passes an `idempotency_key` in every workflow input, derived from the Temporal activity ID (e.g., `${workflowId}-${activityId}-${attempt}`). The workflow's first step looks up prior runs by that key in a small `workflow_idempotency` table (added as part of this slice) and returns the prior result if found. This is in addition to Medusa Workflow Engine's own idempotency tracking — the explicit key lets us span Temporal retries cleanly even across worker restarts.

## 7. Admin API routes

New routes under `apps/backend/src/api/admin/`. These are the surface the procurement-agent calls (no Store routes in this slice; agent uses admin authentication).

| Route | Method | Workflow invoked |
|---|---|---|
| `/admin/vendors` | GET / POST | list / `createVendorWorkflow` |
| `/admin/vendors/:id` | GET / POST / DELETE | retrieve / `updateVendorWorkflow` / `softDeleteVendorWorkflow` |
| `/admin/items` | GET / POST | list / `createItemWorkflow` |
| `/admin/vendor-items` | GET / POST | list / `createVendorItemWorkflow` |
| `/admin/purchase-orders/:id/link-inbound-message` | POST | `linkInboundMessageToPOWorkflow` (body: `{ message_id: string }`) |
| `/admin/purchase-orders/:id/link-outbound-message` | POST | `linkOutboundMessageToPOWorkflow` (body: `{ message_id: string }`) |
| `/admin/vendors/:id/tone-reference` | POST | `setVendorToneReferenceWorkflow` (body: `{ message_id: string }`) |
| *(messaging routes — `/inbound`, `/outbound`, `/threads`, `/channel-accounts` — live on the messaging service at its own host, not on Medusa. See §16.4.)* | — | — |
| `/admin/files` | POST | upload + register (compute SHA256 in route, then call workflow) |
| `/admin/purchase-orders` | GET / POST | list / `createPODraftWorkflow` |
| `/admin/purchase-orders/:id` | GET / POST | retrieve (with events + files via `query.graph`) / `editPODraftWorkflow` |
| `/admin/purchase-orders/:id/files` | POST | `attachFileToPOWorkflow` |
| `/admin/purchase-orders/:id/placeholders/:field` | POST | `resolvePlaceholderWorkflow` |
| `/admin/purchase-orders/:id/mark-sent` | POST | `markPOSentWorkflow` |
| `/admin/purchase-orders/:id/mark-confirmed` | POST | `markPOConfirmedWorkflow` |
| `/admin/purchase-orders/:id/mark-needs-review` | POST | `markPONeedsReviewWorkflow` |
| `/admin/purchase-orders/:id/cancel` | POST | `markPOCancelledWorkflow` |

All routes use Zod schemas in `middlewares.ts` for body validation, with the inferred type passed to `MedusaRequest<T>` per type-safety conventions. Only GET / POST / DELETE methods per Medusa convention; no PUT/PATCH.

## 8. Procurement-agent (`apps/procurement-agent/`)

### 8.1 Code adopted from stealth

Imported with minimal changes:

- `src/agents/_shared/` — shared prompt utilities, schema helpers, tool definitions
- `src/agents/place-drafting/` — drafts a PO from a captured order request
- `src/agents/vendor-match/` — fuzzy-matches a vendor name from an email to a Medusa Vendor
- `src/agents/inbound-classifier/` — classifies an incoming message (any channel: order request / vendor confirmation / bill / dock photo / chase / other)
- `src/agents/outbound-classifier/` — classifies an outbound draft before sending (any channel)
- `src/agents/slack-intent/` — parses Slack-channel inbound messages into agent intents (a specialization of the inbound classifier for the Slack channel; lives alongside the general classifier until consolidation makes sense)

Imported with rewrites:

- The deterministic-write phase of each activity dispatches to **two clients** depending on what's being written. Where stealth wrote directly via Drizzle into one DB:

  ```ts
  // before (stealth)
  await db.insert(purchaseOrder).values({...})
  await db.insert(emailRecord).values({...})
  ```

  becomes:

  ```ts
  // after (procurement-agent)
  // procurement-domain writes → Medusa
  await medusaSdk.admin.workflows.createPODraft.run({
    input: {...},
    idempotency_key: ctx.activityId,
  })

  // messaging-domain writes → messaging service
  await messagingClient.outbound.create({
    channel: 'email',
    body_plain: '...',
    purchase_order_id: po.id,    // opaque ref back to Medusa
    drafted_by_capability: 'place-drafting@0.1.2',
  })

  // and then linking the message back to the PO in Medusa
  await medusaSdk.admin.workflows.linkOutboundMessageToPO.run({
    input: { purchase_order_id: po.id, message_id: msg.id },
  })
  ```

- Read-only tools split similarly: procurement reads via Medusa `query.graph` / `query.index`; message reads via messaging API (`GET /messages?vendor_id=...`).
- A new subscriber in `apps/procurement-agent/src/subscribers/message-received.ts` consumes the Redis stream that messaging publishes to. When a procurement-relevant message arrives (classified as `order-request`, `vendor-confirmation`, `bill`, etc.), the subscriber triggers a Temporal workflow.

### 8.2 Temporal workflow structure for this slice

```
purchaseOrderWorkflow (parent, long-running)
  └── placeChildWorkflow
        ├── activity: inbound-classifier (if entered via any inbound channel)
        ├── activity: vendor-match
        ├── activity: place-drafting (produces structured PO draft)
        ├── activity: outbound-classifier (validates outbound message)
        ├── signal: human approval (waits, durable)
        ├── activity: send-outbound-message (dispatches to channel adapter — email/SMS/WhatsApp/Slack)
        ├── signal: vendor-confirmed | vendor-changed | timeout
        └── final activity: mark-po-confirmed | mark-po-needs-review
```

Receive/Pay child workflows are stubs in this slice — they exist as no-op functions so the parent workflow compiles, but they're not exercised.

### 8.3 Client setup

Two clients live under `apps/procurement-agent/src/clients/`:

- **`medusa-sdk.ts`** — initializes the Medusa admin SDK with a long-lived API token. Env var `MEDUSA_AGENT_TOKEN`. Full admin scope in v1; tighter scoping is a follow-on hardening task.
- **`messaging-client.ts`** — typed HTTP client for the messaging service. Auth via API key (`MESSAGING_API_KEY`). Generated types come from `packages/shared-types/messaging.ts`.

Both URLs (`MEDUSA_URL`, `MESSAGING_URL`) are env-configurable so the same agent code runs in dev (localhost) and prod.

### 8.4 Observability

- **Langfuse** — every capability call is a Langfuse trace; the trace ID is included in the resulting `procurementEvent.payload.langfuse_trace_id` so admin UI can deep-link.
- **OpenTelemetry** — Temporal worker exports traces; Medusa admin runs the OTel collector configured per stealth's existing setup.

### 8.5 Deployment

The agent is a separate Node process (Temporal worker). In production it runs on the same hosting environment as Medusa and the messaging service, but as a distinct service. In dev, `pnpm dev` (turbo task) starts Medusa + messaging + agent + storefront concurrently.

## 9. Admin UI

Three new admin sections in `apps/backend/src/admin/`, built with Medusa's admin extension primitives:

### 9.1 Vendors

- **List page**: table with name, payment terms, order email, last PO date, open PO count. Filters by name (Index Module backed) and payment terms.
- **Detail page**: vendor profile with editable fields (workflows behind), tabs for:
  - **Items** — VendorItems they sell with last price + last ordered date
  - **POs** — list of POs filtered to this vendor
  - **Ordering Instructions** — editable list
  - **Tone Reference** — pinned email preview (read-only; set via separate workflow)
  - **Files** — vendor-level files (W-9, contract)

### 9.2 Purchase Orders

- **List page**: table with PO number, vendor, place_status, expected delivery, placeholder count, drafted_by_capability. Filters by status (composite — placeholder for future receive/pay states), vendor (Index Module), date range.
- **Detail page**:
  - Header: PO number, vendor, status badge, action buttons (Mark Sent / Mark Needs Review / Mark Confirmed / Cancel — disabled based on current state)
  - **Line items table** with inline placeholder warnings (`[NEEDS PRICE]` shown in red)
  - **Events timeline** — chronological list of events with source badges (human/agent/vendor/system); Langfuse deep-links for agent events
  - **Files** — attached files with preview
  - **Linked emails** — outbound and inbound emails tied to this PO

### 9.3 Inbox (Medusa admin widget over messaging API)

The inbox UI lives inside Medusa admin (operators have one place to be) but doesn't fetch from Medusa — it's a widget that calls the messaging service's HTTP API. This keeps Medusa from owning messaging data while still giving the operator a unified admin experience.

- **List page** (`/admin/inbox`): renders inbound messages grouped by thread. Fetches from `GET /inbound` on the messaging service. Columns: channel badge (email / SMS / WhatsApp / etc.), from_identity, subject (or first line for channels without subjects), classification, vendor (if matched — resolves vendor_id ref against Medusa), received_at. Filterable by channel, classification, vendor.
- **Thread page**: fetches `GET /threads/:id` from messaging. Shows messages in order across the conversation; classification result for each; "Reclassify" action that POSTs to messaging service; "Create PO from this thread" action that triggers the procurement-agent's `place-drafting` capability via a separate trigger endpoint. Channel-specific message details (raw headers, voice transcript confidence, photo OCR) shown in an expandable per-message panel.
- **Channel accounts page**: register and configure `ChannelAccount` records on the messaging service — add an email inbox, register an SMS number, connect a WhatsApp Business account, etc. Channel-specific config rendered from the `channel_config` jsonb via a registered renderer per channel. Credentials (IMAP passwords, Twilio tokens, etc.) are written via the messaging service's API and stored in a secrets-aware store on that service — not in Medusa.
- **PO detail page** (under §9.2) embeds a "Messages" tab that also fetches from messaging — same widget code, filtered by `purchase_order_id`.

## 10. Data migration

### 10.1 Catalog seed (stealth Issue 02 re-run)

Stealth's `scripts/seed-catalog.ts` is rewritten as `apps/backend/scripts/seed-procurement.ts` (or as a Medusa scheduled job for first-run-only). The data source is the **Notion PO database** — the only system with operational history. The script:

1. Reads historical PO data from a Notion DB export (CSV or via Notion API).
2. Calls `createVendorWorkflow` for each unique vendor (idempotent on name).
3. Calls `createItemWorkflow` for each unique canonical item.
4. Calls `createVendorItemWorkflow` to wire vendor ↔ item with historical last-price / last-ordered data.
5. Logs per-record success/failure; idempotent on re-run.

Stealth has its own `seed-catalog.ts` against a Supabase database, but stealth was never operationally loaded with real data — its database is empty or holds only test fixtures. The Notion export is the only ground truth.

### 10.2 In-flight POs (Notion → Medusa)

Out of scope for this slice. The cutover plan in §11 covers it.

### 10.3 Stealth Supabase

The stealth Supabase project holds no operational data, so there is nothing to decommission carefully. It can be torn down at the end of this slice once we've confirmed the seed-procurement script doesn't need anything from it. The architectural artifacts that matter (schema design, ADRs, capability prompts, FSM design) live in code and docs, not in the Supabase instance.

## 11. Rollout / cutover

This slice is **additive** until the final cutover:

1. **Build behind the scenes.** Medusa modules, workflows, admin UI, agent integration all built. Existing Notion PO database continues to be Yemi's daily tool.
2. **Catalog seeded.** Vendors and items populated in Medusa. Admin UI usable read-only.
3. **Shadow-mode agent.** Procurement-agent runs in parallel: classifier reads real inbound emails, vendor-match runs, place-drafting drafts POs — all writing to Medusa, but no outbound emails are sent. Yemi reviews drafted POs in Medusa admin and compares to what he would have created in Notion. This phase runs for 2 weeks minimum, identifying capability bugs without operational risk.
4. **Cutover.** On a chosen date, Yemi stops creating POs in Notion. Open Notion POs are manually migrated by writing one-shot scripts that call the same Medusa workflows (each Notion PO becomes a `createPODraftWorkflow` + appropriate `markPO*` calls to reach its current state). Outbound email sending is enabled in the agent.
5. **Monitor 2 weeks.** Both systems readable; Notion is read-only. After 2 weeks of clean operation, Notion PO database is archived.

## 12. Open questions for implementation phase

These are intentionally left open here so the implementation plan can resolve them:

- **In-process vs. HTTP for agent → Medusa.** Whether the agent imports Medusa workflows directly (in-process call in a monorepo) or hits HTTP. HTTP is cleaner for separate deployment; in-process is faster for dev and avoids a token-management surface. Likely answer: HTTP in production, with a thin local dev mode that uses in-process when both apps run in the same node session. Resolved during implementation.
- **PO number generator.** `LIM-YYYY-NNNN` requires a monotonic counter per year. Options: Medusa `id_generator` extension, a separate sequence table, or `xact_advisory_lock` on a counter row. Decide in implementation; trivial to swap later.
- **File storage.** Stealth uses Supabase Storage. Medusa typically uses S3/MinIO. Decide whether to use Supabase Storage (for continuity) or migrate to S3-compatible. Likely Supabase Storage initially for simplicity.
- **Tone reference enforcement.** ADR 0009 says tone reference is "set by hand, never auto-updated." Implementation question: do we expose a UI button to set it (yes), and do we validate that the chosen email is from the right vendor (yes, in workflow validation).

## 13. Success criteria

This slice is done when **all** of the following are true:

1. A real inbound email from a vendor arrives in a watched inbox, is classified by the agent, and produces a PO draft visible in Medusa admin within 60 seconds.
2. Yemi can review the PO in Medusa admin, resolve placeholders, click **Mark Sent**, and an outbound email is composed by the agent, reviewed, and sent.
3. A vendor reply triggers `markPOConfirmedWorkflow` or `markPONeedsReviewWorkflow` automatically based on outbound-classifier comparing the response to the sent PO.
4. The full event history of the PO is visible as a timeline with source attribution.
5. The catalog seed script runs idempotently and populates ≥80% of historical vendors and items without manual cleanup.
6. The procurement-agent and Medusa backend both deploy successfully and pass health checks in production.
7. 9 ADRs from stealth are preserved under `docs/adr/`, plus a new ADR 0010 documenting the Medusa-as-data-layer decision.
8. Build (`pnpm build` at root) passes with no type errors across all apps.

## 14. References

- Existing stealth code: `~/Desktop/_Code/Active/stealth/`
- Existing catalog-health-worker: `~/Desktop/_Code/Active/catalog-health-worker/`
- Medusa development conventions: `medusa-dev:building-with-medusa` skill (loaded reference files in `reference/custom-modules.md`, `reference/module-links.md`, `reference/querying-data.md`, `reference/workflows.md`, `reference/scheduled-jobs.md`)
- Project context: `AGENTS.md`, `apps/backend/CONTEXT.md` (current), to be extended with procurement domain language adopted from `stealth/CONTEXT.md`

## 15. Design principles (cross-cutting)

These principles apply to this slice and to every future slice. They are codified here once so subsequent specs can reference them rather than re-deriving the abstraction each time. A new ADR 0011 — "External system integrations abstracted by `system` enum" — is written as part of this slice's implementation to record them.

### 15.1 No third-party vendor names appear in module, entity, or enum names

Every integration with an external system uses a `system` enum (or `channel` enum for messaging) + a `system_payload` (or `channel_payload`) jsonb. The vendor name appears **only as an enum value**, never as part of a module, table, column, or workflow name.

| Domain | Where it lives | Discriminator enum | Initial values |
|---|---|---|---|
| Communications | `apps/messaging/` peer service (§16) | `channel` | `email` / `sms` / `whatsapp` / `slack` / `voice` / `manual` / `photo` |
| Point-of-sale | `pos` Medusa module (Slice 4) | `system` | `toast` / `clover` / `square` / `lightspeed` / `shopify_pos` |
| Accounting | `accounting` Medusa module (Slice 3) | `system` | `qbo` / `xero` / `freshbooks` |
| Bill pay | `billPayment` Medusa module (Slice 3) | `system` | `melio` / `stripe` / `ach_direct` |
| Banking | `bankingFeed` Medusa module (later) | `system` | `plaid` / `mx` / `yodlee` |

A new integration is added by: (1) extending the relevant enum, (2) writing a channel-/system-specific adapter for the worker that ingests or sends, (3) defining the jsonb payload shape inside that adapter. **No schema migration is required to add a new integration of an existing domain.**

### 15.2 Adapters dispatch by enum value; the platform doesn't know about specific integrations

The agent layer and Medusa workflows operate against the normalized fields (`address`, `body_plain`, `received_at`, etc.) and never branch on specific enum values. Channel-/system-specific behavior lives in adapters under `apps/procurement-agent/src/adapters/<system>/` (or equivalent for non-agent integrations). The Medusa side stays integration-agnostic.

This means: when an `OutboundMessage` is sent, the messaging service looks up its `ChannelAccount`, reads `channel`, and dispatches to the adapter registered for that channel. The service doesn't know whether it's sending email or SMS at the API level — that's the adapter's job.

### 15.3 Single-table for related-but-channel-varying entities

For every domain where the same conceptual entity exists across multiple integrations (a "message" exists across email/SMS/WhatsApp; a "catalog item" exists across Toast/Clover/Square), use **one table with the discriminator enum + jsonb payload**, not one table per integration. Cross-integration queries ("all inbound messages from this vendor") then become single-table queries.

The cost: jsonb payloads are loosely typed at the DB level. We accept this and enforce shape in TypeScript at adapter boundaries.

### 15.4 LIM-specific naming is fine; vendor-platform-specific naming is not

"LIM" appears in artifacts that are genuinely LIM-specific: PO number format (`LIM-YYYY-NNNN`), the procurement workflow rhythms, default unit conventions. "Lagos International Market" is the business; the platform models that business honestly. Vendor-platform names (Toast, QBO, Melio, Twilio, Notion, etc.) are not LIM-specific — they are choices that could change — and so they don't appear in the names of our own concepts.

## 16. Messaging service (`apps/messaging/`)

A standalone Node service that models inbound and outbound communications across **any channel** (email / SMS / WhatsApp / Slack / voice / manual / photo). Sits next to Medusa in the monorepo and runs as a peer process. Owns its own data, its own channel adapters, and a small HTTP API. Consumed by Medusa (admin widgets), the procurement-agent (Temporal activities), and — in future slices — any other consumer that needs to send or receive structured messages (storefront customer support, internal ops, etc.).

ADR 0011 — "External system integrations abstracted by `system` enum" — formally records this design alongside the parallel pattern for POS / accounting / banking.

### 16.1 Stack

| Component | Choice |
|---|---|
| Runtime | Node 20+ (same as Medusa) |
| HTTP framework | Fastify (or Hono — decide in implementation; both are fast, typed, and minimal) |
| ORM | Drizzle (matches stealth's existing tooling and what the catalog ETL author already knows) |
| Database | Same Postgres instance as Medusa, **separate schema** (`messaging`). Drizzle migrations live under `apps/messaging/drizzle/`. Splitting into a separate DB is trivial later if scale demands it. |
| Event publishing | Redis Streams (using the Redis instance already configured for Medusa's Workflow Engine in `apps/backend/medusa-config.ts`). Stream name: `messaging.events`. |
| Secrets | Channel credentials (IMAP password, Twilio auth token, WhatsApp access token, Slack bot token, etc.) stored encrypted in the `messaging` schema using a key from env (`MESSAGING_SECRETS_KEY`); accessed only by adapter code. |

### 16.2 Data model

Same shape as the earlier in-Medusa design, now in Drizzle on the `messaging` schema:

- **`channel_account`** — id (uuid), channel (enum: `email` / `sms` / `whatsapp` / `slack` / `voice` / `manual` / `photo`), address (text — `yemi@lagosinternationalmarket.com`, `+1-555-0100`, `#procurement` Slack channel, etc.), display_name, channel_config (jsonb, channel-specific config — outbound capture method for email, Twilio Account SID for SMS, etc.), secrets_ref (text, nullable — opaque pointer into the encrypted-secrets table), is_active, created_at, updated_at.
- **`message_thread`** — id, channel (enum), external_thread_id (the channel's native thread ID — email References-header chain, SMS phone-number-pair, WhatsApp conversation ID, Slack `thread_ts`), vendor_id (text, nullable — opaque reference to a Medusa Vendor; set by procurement-agent after vendor-match), first_message_at, last_message_at, message_count.
- **`inbound_message`** — id, channel_account_id (FK), thread_id (FK, nullable until thread is resolved), external_message_id (channel's native ID; unique-per-channel), from_identity (text), to_identities (text[]), subject (nullable), body_plain (text), body_html (text, nullable), received_at (timestamp), channel_payload (jsonb — raw email headers, Twilio webhook body, WhatsApp Cloud API payload, voice transcript with confidence scores, etc.), classification (text, nullable — set by an external classifier via API), classified_at (nullable), vendor_id (text, nullable — opaque ref).
- **`outbound_message`** — id, channel_account_id (FK), thread_id (FK, nullable for new conversations), external_message_id (nullable until sent), in_reply_to_external_id (nullable), to_identities (text[]), cc_identities (text[], nullable), subject (nullable), body_plain, body_html (nullable), drafted_by (text, nullable — caller identifier, e.g., `place-drafting@0.1.2`), gate_status (enum: `draft` / `approved` / `sent` / `cancelled`), sent_at (nullable), purchase_order_id (text, nullable — opaque ref), channel_payload (jsonb — channel-specific send metadata, message-tracking IDs, etc.).
- **`attachment`** — id, message_id (FK — points to inbound OR outbound; discriminated by `message_direction` column), sha256 (unique), original_name, mime_type, size_bytes, storage_path. Email PDFs, WhatsApp images, dock-photo uploads.
- **`channel_secret`** *(encrypted)* — id (referenced by `channel_account.secrets_ref`), encrypted_payload (bytea), kdf_meta (jsonb). Decrypted in-process by adapter code using `MESSAGING_SECRETS_KEY`.

`vendor_id` and `purchase_order_id` are stored as plain text — the messaging service has no foreign-key relationship to Medusa. Consumers (procurement-agent, Medusa admin widget) join across systems at query time. This is the explicit boundary: messaging knows about messages, not about LIM's procurement concepts.

### 16.3 Channel adapters

Each adapter lives under `apps/messaging/src/adapters/<channel>/` and exports a uniform interface:

```ts
export interface ChannelAdapter {
  channel: ChannelEnum
  // Inbound side: how this channel ingests
  ingestion: 'webhook' | 'poll'
  registerWebhook?(app: FastifyInstance): void   // adapter mounts its own webhook route
  startPoller?(account: ChannelAccount): Cancel  // adapter runs its own poll loop
  // Outbound side: how this channel sends
  send(account: ChannelAccount, message: OutboundMessageDraft): Promise<SendResult>
}
```

Initial adapters in Slice 1:

| Channel | Ingestion | Send | Notes |
|---|---|---|---|
| `email` | IMAP poll (Gmail OAuth where available, fallback to IMAP password) | SMTP / Gmail API | The primary channel for v0 — Yemi's mailbox, Grace's mailbox, shared `procurement@` archive |
| `manual` | API only (no ingestion adapter — form posts) | n/a | "Yemi typed: vendor confirmed verbally" — covers the gap where there's no native channel |
| `photo` | API only (file upload) | n/a | Dock photos, paper invoices captured by phone |

Deferred to Slice 2+: `sms` (Twilio), `whatsapp` (Meta Cloud API), `slack` (Events API), `voice` (transcript ingestion). The schema accommodates them today; the adapters get implemented when the workflows need them.

### 16.4 HTTP API

All routes under `/v1/`. Authentication via API key in `Authorization: Bearer <MESSAGING_API_KEY>` header. Issued per consumer (one for procurement-agent, one for Medusa admin, one for storefront when it arrives).

| Route | Method | Description |
|---|---|---|
| `/v1/channel-accounts` | GET / POST | List / create channel accounts. POST writes secrets via the encrypted-secrets table. |
| `/v1/channel-accounts/:id` | GET / DELETE | Retrieve / soft-delete. |
| `/v1/inbound` | GET | List inbound messages. Query params: `channel`, `vendor_id`, `classification`, `from_identity`, `received_after`, `received_before`, `limit`, `cursor`. |
| `/v1/inbound` | POST | Create an inbound message (used by channel adapters when ingesting; also by `manual` channel form). |
| `/v1/inbound/:id` | GET | Retrieve with attachments and channel_payload. |
| `/v1/inbound/:id/classify` | POST | Set classification + classified_at. Body: `{ classification: string, classifier_metadata?: object }`. |
| `/v1/inbound/:id/link-vendor` | POST | Set vendor_id. Also propagates to the message's thread. Body: `{ vendor_id: string }`. |
| `/v1/outbound` | GET / POST | List / create outbound drafts. |
| `/v1/outbound/:id` | GET / DELETE | Retrieve / cancel (soft-delete). |
| `/v1/outbound/:id/approve` | POST | Move gate_status from `draft` to `approved`. |
| `/v1/outbound/:id/send` | POST | Dispatch to channel adapter; updates gate_status to `sent` on success. |
| `/v1/threads` | GET | List threads. Query params: `channel`, `vendor_id`, `purchase_order_id` (via joined outbound), `updated_after`, `limit`, `cursor`. |
| `/v1/threads/:id` | GET | Retrieve with full message timeline (interleaved inbound + outbound, ordered by occurred_at). |
| `/v1/attachments/:id` | GET | Download or pre-signed URL. |

### 16.5 Event publishing

When a state change happens, the service publishes to the `messaging.events` Redis stream. Event shape:

```ts
type MessagingEvent =
  | { type: 'inbound.received',  inbound_id: string, channel: ChannelEnum, classification: null, received_at: string }
  | { type: 'inbound.classified', inbound_id: string, classification: string, classified_at: string }
  | { type: 'inbound.vendor_linked', inbound_id: string, vendor_id: string }
  | { type: 'outbound.drafted', outbound_id: string, drafted_by: string, purchase_order_id: string | null }
  | { type: 'outbound.approved', outbound_id: string }
  | { type: 'outbound.sent', outbound_id: string, external_message_id: string, sent_at: string }
```

Consumers (procurement-agent for now) read the stream as a durable subscriber. Replay is possible because Redis Streams retain history.

### 16.6 Medusa admin integration

Medusa admin widgets call the messaging service at `MESSAGING_URL/v1/...` from the browser, with the user's session-derived API key. The widget code lives in `apps/backend/src/admin/messaging-widgets/` and is registered into Medusa's admin extension system as:

- `/inbox` route (top-level admin page) — list + thread views
- Tab embedded in `/admin/vendors/:id` — recent inbound messages for this vendor (resolves the vendor_id reference on the messaging side)
- Tab embedded in `/admin/purchase-orders/:id` — messages tied to this PO

The widget treats the messaging service as a generic typed REST API; it doesn't know it's the same monorepo. This means the same UI code can later be lifted into a different admin shell if needed.

### 16.7 What this slice does NOT include

- **SMS / WhatsApp / Slack / voice adapters.** Schema supports them; implementation deferred.
- **Cross-account dedup or unified inbox across operators.** v0 has each operator's email inbox modeled as a separate `ChannelAccount`; the agent classifies independently per account.
- **Full audit log of API requests.** Logging exists; structured audit (who classified what, when) is a Slice 2+ hardening item.
- **Multi-tenancy.** v0 is single-tenant (LIM). A `tenant_id` field is added to every table from day one to make future multi-tenancy possible without re-migration, but no enforcement is wired up.

### 16.8 Success criteria for the messaging service specifically

In addition to the slice-wide criteria in §13, the messaging service is done when:

1. A real inbound email lands in an IMAP-watched mailbox, becomes an `inbound_message` row within 60 seconds, and emits an `inbound.received` event the procurement-agent consumes.
2. A manual entry (form POST to `/v1/inbound`) creates a message with `channel='manual'` and produces the same downstream behavior.
3. An outbound draft created via `POST /v1/outbound` can be approved and sent via the email adapter, with `sent_at` and `external_message_id` populated.
4. The Medusa admin inbox widget renders inbound messages with channel badges and is filterable by vendor.
5. The service deploys as a distinct process; restart loses no in-flight messages (writes are durable; channel adapter retries pick up where they left off).
