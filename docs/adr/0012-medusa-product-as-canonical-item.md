# Use Medusa `Product` as the canonical item; vendor-cost data lives in custom modules

LIM's canonical item ("Seboye Yam Flour 8 lbs") maps cleanly onto Medusa's built-in `Product` + `ProductVariant` + `ProductCategory` + `ProductTag` + `Image`. Building a parallel custom `item` module would duplicate framework functionality (admin UI, hierarchical categories, variant/option model, image handling) and force a hard migration when Wholesale storefront ships.

**Decision.** Use Medusa `Product` as the canonical item. Pack-size variants are `ProductVariant` records via `ProductOption` `pack-format`. The LIM taxonomy (3 menus / 6 groups / ~63 subgroups) is a seeded hierarchical `ProductCategory` tree. Brand is a `ProductTag`. Two custom modules extend this for procurement: `productProcurement` (`storage_type`, `is_perishable`, `default_buy_unit`, `notes_for_agent` — 1:1 with `Product`) and `vendorItem` (per-vendor cost prices, SKUs, lead times — links `Vendor` ↔ `ProductVariant`). Medusa's `Pricing` module remains orthogonal — it handles SELL prices; vendor COST prices live in `vendorItem`.

## Considered alternatives

- **Parallel custom `item` module** (rejected) — duplicates Medusa's Product model with no admin UI benefit; requires manual migration to Product when Wholesale ships; loses native variant/category/tag/image support.
- **Use Medusa `Product` but store procurement fields in `Product.metadata` jsonb** — fine for one-off annotations but blocks structured filtering ("show me all frozen items") and validation. The thin `productProcurement` module gives typed schema + filterable fields with minimal overhead.
