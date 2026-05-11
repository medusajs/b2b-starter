# Item + VendorItem catalog seeded from a year of historical POs at build time

**Decision:** v0 ships with a populated `Item` and `VendorItem` catalog, derived via a one-time pre-build ETL over the year of historical PO data. Free-text-only (no catalog) was rejected; lazy-bootstrap-from-empty was also rejected.

**Why a catalog at all:** every line-level query the records doc names ("every PO with goat shoulder in last 6 months") and every Pay-phase reconciliation step (mapping a Bill line to its PO line) is dramatically more reliable when both sides reference a canonical Item rather than fuzzy-matching free text. The v2/v3 roadmap (Toast catalog link, BOM/yield) requires canonical items as a prerequisite. Doing it later means re-clustering strictly more historical data.

**Why seeded, not lazy-bootstrapped from empty:** the seed data exists. Not using it means every first PO from every vendor incurs a "create the canonical Item" friction step. Worse, lazy bootstrap with no seed leaves the catalog sparse for months and cripples the agent's pricing intelligence ("last seen $X from this vendor") in the very early period when correctness matters most for trust calibration.

**The ETL:**
1. Extract all line items from a year of historical POs into a flat working table.
2. LLM-cluster descriptions per Vendor.
3. Human-review clusters (merge/split/rename) — bounded manual step, hours not days.
4. Cross-vendor canonicalization: collapse same-buy-item clusters across Vendors into one `Item`.
5. Populate `Item` and `VendorItem` rows; backfill `POLineItem.item_id` and `vendor_item_id` from the cluster mapping.

**Trade-off:** 1–3 days of upfront ETL work delays v0 ship. Bounded, one-time, dividends every day after.

**Three-layer description fields kept, on purpose:** `POLineItem.description` (as-sent on this PO), `VendorItem.vendor_description` (vendor's preferred phrasing), `Item.name` (LIM-canonical). Each serves a distinct query.
