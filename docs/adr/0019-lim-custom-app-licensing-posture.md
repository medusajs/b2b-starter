# LIM Custom App licensing posture

ERPNext is licensed **GPL v3**; Frappe Framework is MIT. Our `lim_procurement` Custom App extends ERPNext via the standard "separable Frappe app" pattern — own git repo, own DocTypes, own whitelisted REST methods, Custom Fields and hooks declared via Fixtures — which gives reasonable distance from "derivative work" in the parts that don't strictly require ERPNext. GPL only triggers on **distribution**; as long as LIM uses this internally for its own business, GPL never bites. If distribution ever becomes a future concern (sell to another business, open-source, multi-tenant SaaS), we'll license `lim_procurement` itself under GPL v3 to be safe (and verify with counsel if SaaS gets serious).

## What "separable" means concretely

- **Own DocTypes** (`LIM Activity`, optional `LIM Vendor Tag`) use only Frappe Framework primitives — could theoretically run on a Frappe bench without ERPNext. Most clearly separable.
- **Whitelisted REST methods** in `lim_procurement.api` are own Python code. Separable.
- **Custom Fields** on ERPNext's Supplier / Item / Purchase Order are declared as Fixtures (JSON data files), not patches to ERPNext source. Functionally meaningless without ERPNext, so the most derivative-coupled layer — but they're data, not modified ERPNext code.
- **Hooks** subscribing to ERPNext document lifecycle events (`Purchase Order on_submit`, etc.) are the most coupled-to-ERPNext layer. Inherently depends on ERPNext's runtime contracts.

## Practical implications

- **Don't fork ERPNext** to patch behavior. Use hooks, overrides, and Custom Fields. Forking ERPNext = clearly derivative + harder to upgrade.
- **Don't import private ERPNext modules** in `lim_procurement` code. Use documented Frappe Framework APIs (`frappe.get_doc`, `frappe.db.get_value`, `@frappe.whitelist`, hooks).
- **Keep `lim_procurement` in its own git repo** at `github.com/yemi-lagosinternationalmarket/lim-procurement`, not bundled into b2b-starter. Independent versioning, independent license stamp.
- **Choose a license for `lim_procurement` itself.** Default until distribution comes up: leave unlicensed (private). If/when distributed, GPL v3 is the safest reciprocal license that doesn't pick a fight with ERPNext's license.
