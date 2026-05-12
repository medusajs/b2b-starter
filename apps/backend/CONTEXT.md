# Backend — Domain Language

LIM's procurement and commerce platform. Vocabulary adopted from stealth's procurement glossary (Place / Receive / Pay) plus B2B commerce concepts from Medusa.

Per ADR 0018, **ERPNext is the system of record** for procurement, vendors, items, inventory, accounting, and BOMs. **Medusa is scoped to commerce** — B2B storefront primitives (Company, Employee, Quote, Approval) and the future wholesale storefront. **Stealth (Temporal worker)** orchestrates AI-driven workflows that span both. **`apps/messaging`** is a peer service that handles inbound/outbound communications.

When this document and code disagree, fix the code.

## Phases

- **Place** — agreeing on an order with a Supplier. In ERPNext this spans `Purchase Order` (and optional `Request for Quotation` + `Supplier Quotation`).
- **Receive** — getting the goods. In ERPNext this is `Purchase Receipt` (with multi-warehouse Stock Entry).
- **Pay** — settling the bill. In ERPNext this is `Purchase Invoice` → `Payment Entry`, posting to the GL.

## Language

### Procurement (lives in ERPNext)

**Supplier**:
A supplier of goods to LIM. Native ERPNext DocType. The LIM Custom App adds Custom Fields: `agent_authority` (select), `tone_reference_message_id` (data), `frequency` (select), `follow_up_level` (select), `default_lead_time_days` (int), `order_minimum_text` (small text), `vendor_sends_truck` (check), `we_arrange_freight` (check), `freight_fee` (currency), `pallet_fee` (currency).
_Avoid_: vendor (use only as a colloquial synonym in conversation; in code and docs, use `Supplier`).

**Item**:
The canonical buy/sell item identity, cross-supplier and cross-channel. Native ERPNext DocType. LIM Custom Fields: `storage_type` (select: ambient/refrigerated/frozen), `is_perishable` (check), `default_buy_unit` (link to UOM), `notes_for_agent` (long text).

**Item Supplier** *(ERPNext native — joins Item and Supplier)*:
Per-(supplier, item) knowledge: supplier's SKU for this item, last unit price, lead time, MOQ. LIM Custom Fields if needed.

**Purchase Order** (PO):
The agreement to buy specific items from a Supplier. Native ERPNext DocType. Identified by ERPNext's `name` (e.g., `LIM-PO-2026-00001`) plus its internal docname. LIM Custom Fields: `agent_active` (check), `drafted_by_capability` (data), `placeholder_count` (int — computed), `temporal_workflow_id` (data), `idempotency_key` (data).
_Avoid_: order (ambiguous with sales orders; prefer **PO**), purchase, transaction.

**Purchase Receipt** *(ERPNext native — Receive phase)*:
Record of goods physically arriving from a Supplier for a PO. Carries per-line received_qty, warehouse, batch/serial info.

**Purchase Invoice** *(ERPNext native — Pay phase)*:
Supplier's request for payment after delivery. Often arrives as a PDF; ERPNext extracts structured fields. Posts to the General Ledger on submit.

**Payment Entry** *(ERPNext native — Pay phase)*:
The money sent to settle a Purchase Invoice. Posts to GL.

**BOM** (Bill of Materials):
For Seboye packaging — defines components and routing to produce a finished Item from raw inputs. Native ERPNext DocType.

### Commerce (lives in Medusa)

**Customer / Company / Employee / Quote / Approval**:
B2B commerce primitives from the Medusa B2B starter. Unchanged from the original repo. Customer is the B2B business that places sales orders with LIM.

**Product / ProductVariant / ProductCategory / ProductTag / Image**:
Medusa Product mirrors a publishable subset of ERPNext `Item` for storefront display. One-way sync ERPNext → Medusa. The Medusa side handles consumer-facing concerns (descriptions, images, categories for browsing); ERPNext owns the canonical buying/inventory side.

### Platform infrastructure

**Activity** *(cross-system audit log — to be refined during implementation)*:
An immutable record of something that happened — a state transition, an agent observation, a human action. Polymorphic by target entity (PO, Supplier, Item, message thread, etc.). May live as a Custom DocType in the LIM Custom App or as a thin module elsewhere; the design intent from ADR 0014 carries forward, only the home changes.
_Avoid_: "event" alone (collides with Frappe's event hooks); "log entry".

**Message** *(in `apps/messaging`, not Medusa or ERPNext)*:
An inbound or outbound communication on any channel (email, SMS, WhatsApp, Slack, voice, manual, photo). Stored in the messaging service's own Drizzle schema; cross-system references via opaque text IDs.

**Attachment** *(in `apps/messaging` for messages; in ERPNext File for procurement artifacts)*:
Persistent file metadata. SHA256-deduped within each storage backend. Cross-references via opaque IDs.

### Agent-side terms

**stealth**:
The procurement agent. Runs as a long-running Temporal worker (`apps/procurement-agent/`). Has a visible identity in admin event timelines and in the `#stealth` Slack channel. Versioned per-capability (`place-drafting@0.1.2`).

**Capability**:
A single LLM-using job in the agent — has its own prompt, structured output schema (Zod), optional read-only tools, and a Temporal activity wrapper. Per ADR 0016. One capability = one focused LLM call preceded by deterministic prep and followed by deterministic writes to ERPNext REST and/or Medusa SDK and/or messaging API.

**`agent_authority`**:
Per-supplier control over what stealth may commit autonomously. `full_auto` (commits without human approval; downstream gates still apply), `draft_only` (drafts but never sends or marks state without explicit human approval — **default for new and seeded suppliers**), `review_only` (observes and classifies only, doesn't draft). Lives as a Custom Field on ERPNext Supplier.

**Tone reference**:
A single curated past inbound message pinned per Supplier (`tone_reference_message_id` Custom Field — opaque ref to the messaging service) used to calibrate the tone of agent-drafted outbound. Set by hand; never auto-updated.

**Global pause**:
A platform-wide flag (Redis-backed with TTL) suppressing all agent auto-fires. Per-supplier authority is checked first; if global pause is on, no auto-fire happens regardless of authority. Toggled via admin control or `/stealth pause Xm` Slack slash command.

**Placeholder**:
An unresolved field in an agent draft (`[NEEDS PRICE]`, `[NEW ITEM]`, `[STALE: $X, last seen DATE]`). Sending is gated until cleared.

**Coexistence**:
The pattern by which humans and the agent share authority without explicit take-over. Per ADR 0013. The agent re-reads state at every decision point. Workflows are idempotent. ERPNext webhooks become Temporal signals so long-running workflows notice human edits.

**LIM Custom App**:
The git-versioned Frappe app that holds LIM-specific extensions of ERPNext — Custom Fields, Custom DocTypes (sparingly), hooks, whitelisted REST methods. Thin by design; heavy logic lives in stealth and peer services.

## Relationships

- A **Supplier** has many **Purchase Orders**.
- A **Purchase Order** has many line items (referencing **Items**).
- A **Purchase Order** has zero or one **Purchase Receipt** (Receive phase).
- A **Purchase Receipt** has zero or one **Purchase Invoice** (Pay phase).
- A **Purchase Invoice** has zero or many **Payment Entries** (could be split).
- An **Item** appears in many **Item Supplier** rows (one per supplier that carries it).
- A **Product** (Medusa) mirrors one **Item** (ERPNext) for items LIM publishes to its storefront.
- An **Activity** targets at most one entity (by `target_entity_type` + `target_entity_id` — types may be cross-system: `purchase_order`, `supplier`, `item`, `message_thread`).

## Example dialogue

> **Dev**: "When stealth drafts a PO for Yusol, where does it live?"
> **Owner**: "As a `Purchase Order` in ERPNext. Stealth posts the structured output to a whitelisted Frappe method that creates the PO with `custom_drafted_by_capability='place-drafting@x.y.z'`. The timeline shows the `po_drafted` Activity. If Yusol's Supplier record has `agent_authority='full_auto'` and no placeholders remain, stealth marks the PO Submitted and sends the outbound email via the messaging service. Otherwise it waits for human approval."

> **Dev**: "And the storefront?"
> **Owner**: "When we launch the wholesale storefront, Medusa pulls a subset of ERPNext Items (the ones we publish) as Medusa Products. Sales orders go through Medusa with Company/Quote/Approval primitives; on submit they create a corresponding Sales Order in ERPNext for inventory deduction and accounting. ERPNext stays the truth for what's in stock and what's been invoiced."

## Flagged ambiguities

- **"Order"** — colloquially ("the Ilham order") refers to the **PO**. In writing, always say **PO** (purchase order) or **Sales Order** (customer order) explicitly. Never bare "order."
- **"Vendor"** — colloquial synonym for **Supplier**. In code and docs, use **Supplier** (ERPNext's term).
- **"Account"** — never used bare. Disambiguate: **Supplier** (the business), **ChannelAccount** (a registered messaging identity), **Account** (ERPNext's chart-of-accounts entry — GL).
- **"Event"** — domain people may say "event" meaning **Activity** (something that happened, recorded in the audit log). Don't confuse with Frappe Hooks (server-side event handlers) or Temporal signals.
- **"Item"** — ERPNext's canonical buy/sell unit. Don't confuse with Medusa's "ProductVariant" — the storefront mirror.
- **"Status"** — disambiguate which: **Supplier.disabled** (ERPNext), **Purchase Order.workflow_state** or `.docstatus` (ERPNext FSM), **agent_authority** (LIM Custom Field), our internal **Place/Receive/Pay phase** vocabulary.
- **"Cancelled"** — flavors: Place-phase **Cancelled** (we backed out before/during ordering — PO `docstatus=2`), Receive-phase **Vendor Cancelled** (supplier reneged — Purchase Receipt not created), Pay-phase **Written Off** (no settlement happened — Purchase Invoice cancelled / written off).
