# Backend — Domain Language

LIM's procurement and commerce backend. Adopted from stealth's procurement glossary (Place / Receive / Pay) plus B2B commerce concepts from the Medusa starter.

When this document and code disagree, fix the code.

## Phases

- **Place** — agreeing on an order with a Vendor.
- **Receive** — getting the goods. (Out of scope until Slice 2.)
- **Pay** — settling the bill. (Out of scope until Slice 3.)

## Language

### Procurement domain (custom modules)

**Vendor**:
A supplier of goods to LIM, with its own status, rating, ordering rhythm, freight defaults, payment terms, and `agent_authority`.
_Avoid_: supplier, seller.

**VendorContact**:
Additional contacts on a Vendor beyond the denormalized main + AP contact (e.g., warehouse manager, driver dispatch).

**VendorTag**:
Free-text categorical labels for filtering vendors (`dry-goods`, `frozen`, `produce`).

**VendorItem**:
Per-(vendor, variant) knowledge — vendor SKU, cost-price history, lead time, vendor MOQ. Joins a `Vendor` to a Medusa `ProductVariant`.

**PurchaseOrder** (PO):
The agreement to buy specific items from a Vendor. Lives across Place / Receive / Pay until paid or written off. Identified by `LIM-YYYY-NNNN` and a UUID.
_Avoid_: order (ambiguous with sales orders), purchase, transaction.

**POLineItem**:
A single ordered line on a PO. References a Medusa `ProductVariant` (nullable for free-text lines drafted by the agent for unfamiliar products).

**POSnapshot**:
A frozen, full copy of a PO + line items at a terminal moment (PO sent, payment initiated). Carries a reference to the actual rendered email/PDF the vendor saw. Audit-grade; rare.

**ProductProcurementAttributes**:
Procurement-specific extension on a Medusa `Product` — `storage_type`, `is_perishable`, `default_buy_unit`, `notes_for_agent`. 1:1 with Product.

### Platform infrastructure (agnostic modules)

**Activity**:
An immutable, append-only record of something that happened on the platform — a state transition, an agent observation, a human action. Polymorphic by target entity (PO, vendor, product, message thread, etc.). Used by every domain (procurement, catalog-health, accounting, customer support…).
_Avoid_: "event" alone (collides with Medusa's runtime Event Bus); "log entry" (too generic).

**Attachment**:
The persistent metadata for a stored file (PDF, photo, email body) — SHA256-deduped, classified by `file_kind`, with provenance. Storage backend is Medusa's File module; `Attachment` adds the metadata layer the File module doesn't persist.

**AttachmentLink**:
A many-to-many link recording that an `Attachment` is attached to a specific target entity (PO, bill, message thread, audit issue…). Polymorphic by `target_entity_type` + `target_entity_id`.

### Medusa built-ins used as-is

**Product / ProductVariant / ProductCategory / ProductTag / Image**:
LIM's canonical items live as Medusa `Product` records. Pack-size variants ("case of 12", "single unit") are `ProductVariant`s via the `ProductOption` `pack-format`. The LIM taxonomy (3 menus / 6 groups / ~63 subgroups) is a hierarchical `ProductCategory` tree. Brand is a `ProductTag`.
_Avoid_: parallel-modeling an "Item" entity. LIM concepts map onto Medusa primitives.

**Customer / CustomerGroup / Company / Employee**:
End-customer concepts (the B2B businesses we sell to). Used by the existing B2B starter; orthogonal to Vendor.

### Agent-side terms

**`agent_authority`**:
Per-vendor control over what stealth may commit autonomously. `full_auto` (commits without human approval), `draft_only` (drafts but never sends — default), `review_only` (observes only).

**Tone reference**:
A single curated past inbound message pinned per Vendor used to calibrate the tone of agent-drafted outbound. Set by hand; never auto-updated.

**Global pause**:
A platform-wide flag (Redis-backed) suppressing all auto-fires. Per-vendor authority is checked first; if global pause is on, no auto-fire happens regardless.

**Placeholder**:
An unresolved field in an agent draft (`[NEEDS PRICE]`, `[NEW ITEM]`, `[STALE: $X, last seen DATE]`). Sending is gated until cleared.

**Coexistence**:
The pattern by which humans and the agent share authority without explicit take-over. The agent re-reads state at every decision point and adapts. Workflows are idempotent. Medusa state-change events become Temporal signals so long-running workflows notice human edits.

## Relationships

- A **Vendor** has many **PurchaseOrders**.
- A **PurchaseOrder** has many **POLineItems**.
- A **POLineItem** references a Medusa **ProductVariant** (zero-or-one — null for free-text lines).
- A **Vendor** has many **VendorItems**; a **ProductVariant** has many **VendorItems** (one per vendor that carries it).
- A **Product** has 0 or 1 **ProductProcurementAttributes**.
- A **PurchaseOrder** has 0 or many **POSnapshots** (one per terminal moment).
- An **Activity** targets at most one entity (by `target_entity_type` + `target_entity_id`) — usually a PurchaseOrder, Vendor, or Product.
- An **Attachment** is linked to entities via **AttachmentLinks** (many-to-many).

## Example dialogue

> **Dev**: "When stealth drafts a PO for Yusol, where does the resulting PO live?"
> **Owner**: "As a `PurchaseOrder` in Medusa, with line items referencing the right `ProductVariant`s. The activity timeline picks up the `po_drafted` Activity and shows it in admin with stealth as the source."

> **Dev**: "And if Yusol's name in Notion was 'Yusol Foods' but their invoices come from 'YSL Trading' — which is the Vendor?"
> **Owner**: "`Yusol Foods` is the Vendor name. `YSL Trading` goes in `legal_name`. The agent uses the legal name on the PO header but addresses outbound emails to `main_contact_email`."

## Flagged ambiguities

- **"Order"** — colloquially ("the Ilham order") refers to the **PO**. In writing, always prefer **PO** to avoid confusion with sales orders.
- **"Account"** — never used bare. Disambiguate: **Vendor** (the business), **ChannelAccount** (a registered messaging identity), or `account_number_at_vendor` (your customer ID at the vendor).
- **"Status"** — disambiguate which: **Vendor.status** (the relationship), **PurchaseOrder.place_status** / `.receive_status` / `.pay_status` (FSM states per phase).
- **"Cancelled"** — three flavors: **Cancelled** (Place-phase terminal — we backed out), **Vendor Cancelled** (Receive-phase terminal — vendor reneged), **Written Off** (Pay-phase terminal — no settlement happened).
- **"Event"** — when domain people say "event" they mean an **Activity** (something that happened, recorded in the activity log). Don't confuse with Medusa's `Event Bus` (runtime pub/sub) or Temporal signals.
- **"File"** — domain people say "file"; the platform persists this as an **Attachment** with metadata. Medusa's `File` module is the storage backend (provider abstraction).
