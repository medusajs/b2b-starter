# ERPNext as ERP system of record; Medusa scoped to commerce

After designing six custom Medusa modules to model procurement (vendor, purchaseOrder, vendorItem, productProcurement, activityLog, attachment) and confirming that GL accounting, multi-location inventory, and BOMs (for Seboye packaging) are all real operational pain points, we re-evaluated the architecture. Medusa is a commerce framework, not an ERP — building ERP-shaped abstractions on top of it duplicates what ERPNext (Frappe framework) already provides natively, and forces us to also stay on QBO for accounting + roll our own multi-location inventory + roll our own BOMs.

**Decision.** Pivot to a service-oriented architecture with **ERPNext as the system of record** for procurement, vendor management, multi-location inventory, accounting/GL, BOMs, and Sales Invoice. **Medusa's role narrows to its actual strength** — B2B commerce primitives (Company, Employee, Quote, Approval) and the future wholesale storefront. The **stealth agent** (Temporal worker), **messaging service** (Fastify peer service), and **catalog-health-worker** remain unchanged in shape — each calls ERPNext REST and the Medusa SDK as appropriate. Medusa `Product` becomes a one-way mirror of ERPNext `Item` for items LIM publishes to its storefront(s).

## Why now

29 issues are created; no code is written. Pivot cost at this point: ~1-2 days of design rework + re-cutting issue scopes. Pivot cost after building 6 custom Medusa modules: 4-8 weeks plus a data migration. The asymmetry is overwhelming.

## Architecture summary

| Concern | System of record |
|---|---|
| Suppliers, POs, Purchase Receipts, Purchase Invoices, GL, multi-location inventory, BOMs, Sales Invoice | **ERPNext** (Frappe bench + LIM Custom App for Custom Fields and any LIM-specific DocTypes) |
| B2B customer-facing storefront (wholesale; future retail online) | **Medusa** (existing B2B starter modules: Company, Employee, Quote, Approval) |
| Catalog item (cross-system canonical) | **ERPNext Item** (Medusa Product mirrors; Toast Item mirrors) |
| Agent orchestration | **Temporal + stealth** (capability write-paths call ERPNext REST or Medusa SDK per ADR 0016) |
| Messaging (email / SMS / Slack / ...) | `apps/messaging` peer service (unchanged) |
| POS | **Toast** (synced from ERPNext Item) |
| Cross-system activity log / audit | Refined during implementation — likely a thin Custom DocType in the LIM Custom App; agent activities recorded there with target entity ID across systems |
| Files / attachments | **ERPNext File** for procurement-side; messaging service for message-side; thin cross-link via opaque IDs |
| BI / reporting | New read-only layer (Metabase / Lightdash) reading both ERPNext and Medusa |

## Isolation discipline (resolves the Frappe single-DB concern)

Frappe DocTypes share one database — but the isolation that matters for LIM lives at the **service layer**, not the table layer. Three rules make this honest:

1. **The LIM Custom App stays thin.** Custom Fields on existing ERPNext DocTypes (Supplier, Item, Purchase Order), a small number of LIM-specific Custom DocTypes only when ERPNext has no native equivalent, hooks for ERPNext events, and a handful of `@frappe.whitelist()` REST methods the agent layer calls. No heavy business logic.
2. **Heavy LIM business logic lives in peer services** (`apps/procurement-agent/`, `apps/messaging/`, catalog-health-worker, BI) that own their own deploy lifecycle, scaling, fault isolation.
3. **No service reads another service's database directly.** All cross-service contracts are versioned REST/SDK APIs.

Under these rules, failure / scaling / swappability isolation is at the service boundary — stronger than Medusa's import-level module isolation in practice, since each service is independently deployed and operated.

## Supersedes / amends

- **ADR 0010** (Medusa as data layer, Temporal as orchestration) — superseded for procurement; Medusa remains the data layer only for commerce. Temporal-as-orchestration unchanged.
- **ADR 0012** (Use Medusa Product as canonical item) — superseded. ERPNext `Item` is canonical; Medusa Product mirrors a publishable subset.
- **ADR 0014** (platform-wide activityLog + attachment modules) — partially superseded. The cross-system activity log concept survives; its implementation moves to a small Custom DocType in the LIM Custom App (or a thin custom module — decide at impl time). The agnostic-polymorphic-target principle carries forward.
- **ADR 0015** (per-vendor `agent_authority` + global pause as trust gradient) — pattern unchanged. `agent_authority` lives as a Custom Field on ERPNext Supplier instead of on a custom Medusa vendor entity. Global pause Redis flag unchanged.

## Unchanged

- **ADR 0011** (external system integrations abstracted by `system` / `channel` enum) — still applies to messaging channels, POS systems, accounting providers, etc.
- **ADR 0013** (coexistence over takeover) — pattern is engine-agnostic. Agent reads ERPNext state at every decision point; ERPNext webhooks become Temporal signals.
- **ADR 0016** (capability shape) — capability folder structure unchanged; only the activity's write-phase target changes (ERPNext REST instead of Medusa SDK for procurement state).
- **ADR 0017** (Conductor considered, staying with Temporal) — independent decision; carries forward.
- **ADR 0001–0009** (stealth's imported ADRs) — three coupled FSMs, runtime stack, system-observes pattern, auto-fire with downstream gates, QBO retirement plan, seeded item catalog, workflow-driven agentic, model selection matrix, pinned tone references — all carry forward. Note: ADR 0005 (QBO as payment source of truth) now reads "until ERPNext Accounts is in production; then ERPNext is."

## Consequences

- **~4 Plan-A slices drop or transform** (Vendor / VendorItem / ProductProcurement / PurchaseOrder custom Medusa modules become "configure ERPNext + LIM Custom App + integrate via REST" issues).
- **Plan B unchanged.**
- **Plan C capability ports unchanged** in shape; write paths now hit Frappe REST for procurement state.
- **New work**: hosting ERPNext (Frappe Cloud managed initially, or self-host on Fly/Railway), the `lim_procurement` Custom App git repo, initial DocType customization, Frappe framework expertise (Python + JS) for ERP-side customizations.
- **Eventual retirements**: QBO retires when ERPNext Accounts is in production; Notion retires as the operational ERP when ERPNext is.
- **The B2B storefront** (Slice 5+) becomes a clean Medusa project — Product/Variant/Category mirror from ERPNext Item; Customers/Companies/Quotes/Approvals stay in Medusa where they belong.
