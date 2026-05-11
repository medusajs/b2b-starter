# Backend — Domain Language

The shared language for Lagos International Market's procurement and commerce backend. Adopted from stealth's procurement glossary (Place / Receive / Pay) plus B2B commerce concepts from the Medusa starter.

When this document and code disagree, fix the code.

## Phases

- **Place** — the phase of agreeing on an order with the Vendor. States: `draft`, `awaiting_payment`, `sent`, `needs_review`, `confirmed`, `cancelled`.
- **Receive** — the phase of getting the goods. (Out of scope until Slice 2.)
- **Pay** — the phase of settling the bill. (Out of scope until Slice 3.)

## Core records

### Vendor

A supplier of goods to LIM. Has payment terms, a primary order contact, and an accounting contact. Vendors carry their own status, rating, ordering rhythm, freight defaults, and an `agent_authority` setting that bounds what stealth is allowed to commit on their behalf.

_Avoid:_ supplier, seller.

Key fields by intent:

- **Identity** — `name`, `legal_name`, `tax_id` (encrypted; for 1099 reporting), `account_number_at_vendor` (your customer-ID at their end), `website_url`
- **Status & trust** — `status` (`active` / `inactive` / `on_hold`), `rating` (1-5), `agent_authority` (`full_auto` / `draft_only` / `review_only`)
- **Address** — flat fields (`address_street`, `address_city`, `address_state`, `address_postal`, `address_country`)
- **Primary contact** — `main_contact_name`, `main_contact_email`, `main_contact_phone`
- **AP / accounting contact** — `ap_contact_name`, `ap_email`, `ap_phone`, `statement_email_or_url`
- **Ordering rhythm** — `order_day`, `cut_off_time`, `frequency`, `follow_up_level`, `default_lead_time_days`, `order_minimum_text`, `ordering_instructions`
- **Freight** — `vendor_sends_truck`, `we_arrange_freight`, `freight_fee`, `pallet_fee`
- **Payment** — `payment_terms`, `net_starts_from`, `preferred_payment_method` (terms used in Place; method execution deferred to Pay)
- **Currency** — `currency` (ISO 4217, default `USD`)
- **Agent context** — `tone_reference_message_id` (opaque ref to messaging service), `notes`

### VendorContact

Additional contacts beyond the denormalized main + AP contact on Vendor. Use when a vendor has more than two relevant humans (e.g., warehouse manager, driver dispatch, sales rep).

### VendorTag

Free-text categorical labels for filtering and grouping vendors. Examples: `dry-goods`, `frozen`, `produce`, `wholesale-only`.

## Agent-side terms

- **`agent_authority`** — Per-vendor control over what stealth may commit autonomously.
  - `full_auto` — stealth drafts, sends, and marks state without explicit human approval (downstream gates still apply).
  - `draft_only` — stealth drafts but never sends or marks state without explicit human approval. **Default for new and seeded vendors.**
  - `review_only` — stealth observes and classifies but does not draft.

- **Tone reference** — A single curated past inbound message pinned per Vendor (`tone_reference_message_id`) used to calibrate the tone of agent-drafted outbound. Set by hand; never auto-updated. Distinct from thread context (recent messages on the current thread).

- **Global pause** — A platform-wide flag (Redis-backed) suppressing all auto-fires. Used when an operator wants stealth to stand down temporarily. Per-vendor authority is checked first; if global pause is on, no auto-fire happens regardless of authority.

- **Placeholder** — An unresolved field in an agent draft (`[NEEDS PRICE]`, `[NEW ITEM]`, `[STALE: $X, last seen DATE]`). Visible in rendered output; sending is gated until cleared.

- **Coexistence** — The pattern by which human edits and agent activity coexist without explicit take-over. The agent re-reads state at every decision point and adapts. Workflows are idempotent so concurrent transitions both succeed (the second is a no-op). Medusa state-change events become Temporal signals so long-running agent workflows notice and respond to human edits.

## Flagged ambiguities

- **"Order"** — colloquially ("the Ilham order") refers to the **PO** for that vendor. In writing, prefer **PO** to avoid confusion with sales orders (Toast / storefront).
- **"Account"** — never used bare. Disambiguate: **Vendor** (the business), **ChannelAccount** (a registered identity at a messaging channel), or `account_number_at_vendor` (your customer ID at the vendor).
- **"Status"** — disambiguate which kind: **Vendor.status** (the relationship), **PurchaseOrder.place_status** (the Place-phase FSM state), etc.
- **"Cancelled"** — has multiple flavors. **Cancelled** is the Place-phase terminal state (we backed out before/during ordering). **Vendor Cancelled** is the Receive-phase terminal (vendor reneged). **Written Off** is the Pay-phase terminal (no settlement happened).
