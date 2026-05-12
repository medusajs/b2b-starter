# FSVP + Traceability module (exploration — not committed)

**Status:** Exploration. Not a decision. Not a slice. Note-to-future-self.
**Origin:** Idea surfaced from another Claude session, 2026-05-12.
**Trigger to revisit:** After Slice 1 ships and LIM is operating on ERPNext.

## Why it's worth thinking about

LIM imports food. Yemi has FDA Food Facility Reg# 10337671048 and the FDA has already made an inquiry. Every grocer above a certain size who imports is supposed to have a written Foreign Supplier Verification Program (FSVP) per 21 CFR 1.502 — almost none of the diaspora-grocer population actually does. FDA inspections are increasing. FSMA 204 (Food Traceability Final Rule) is landing 2026-2028 for additional food categories on the Food Traceability List.

LIM has internal exposure right now. Other diaspora grocers (African, Caribbean, etc.) have the same exposure. Nobody has built FSVP/traceability tooling for these specific food categories.

## What it would be

A module sitting on top of the ERPNext platform we're building. Custom DocTypes in the `lim_procurement` Custom App (or a separate `lim_fsvp` Custom App — see licensing discussion below):

- **Foreign Supplier Profile** — FDA Food Facility Registration, GFSI scheme certifications (BRC, SQF, FSSC 22000), prior notice history, import alert status, last audit date, hazard assessment summary. Linked one-to-one to Supplier.
- **Hazard Analysis** — per-(food, supplier) record identifying biological / chemical (incl. radiological) / physical hazards, requires-control flags, SAHCODHA determination, reasoning. Pre-populated by templates per food category (dried/smoked fish has very different hazards than palm oil than yam flour).
- **FSVP Plan** — the inspectable written document FDA wants. Required sections per 21 CFR 1.504-1.512: hazard analysis reference, supplier evaluation, verification activities, corrective actions, reassessment cadence (every 3 years). PDF output for FDA inspectors.
- **Verification Activity** — onsite audits, sampling and testing records, supplier food-safety record reviews. Type, date, conducted-by, findings, corrective actions. Recurring on a per-supplier risk-based schedule. The "Mimi Foods audit due in 45 days" reminder lives here.
- **Traceability Lot Code** + **Critical Tracking Event** — FSMA 204 substrate. ERPNext's native batch tracking is the foundation; the specific KDE (Key Data Element) schema and 24-hour sortable electronic record format are the work.
- **Food Facility Registration** record — biennial renewal tracking, U.S. Agent designations, registration numbers. Trivial as data; valuable as "the system won't let you forget."

## How the existing platform serves this cleanly

Every architecture decision from the last week sets this up:

| Existing decision | How it serves FSVP/Traceability |
|---|---|
| ERPNext as ERP system of record (ADR 0018) | Supplier / Item / Purchase Receipt / batch tracking are the substrate |
| LIM Custom App as separable Frappe app (ADR 0019) | The FSVP module lives in the same app or its own; same pattern |
| Custom Fields on Supplier (A.1' / #31) | FDA Reg#, GFSI cert, foreign facility info fit as more Custom Fields |
| Custom Fields on Item (A.3' / #32) | Hazard category, batch tracking flags fit naturally |
| LIM Activity polymorphic audit log (A.5' / #34) | Verification Activity records ARE Activity rows; FDA-inspectable timeline |
| Print Format pattern (A.4' / #33) | FSVP Plan PDF generation uses the same Jinja-template approach |
| Capability shape (ADR 0016) | Agent capabilities slot in alongside place-drafting, vendor-match |
| `agent_authority` per supplier (ADR 0015) | Naturally generalizes: a foreign supplier in "review_only" until verified, then "draft_only" until trusted, then "full_auto" |

The platform we're building is the foundation for this module. Nothing gets thrown away.

## Agent capabilities natural to add

When this module ships, stealth gains:

- **classify-compliance-doc** — inbound email with COA / audit report / FDA Form / GFSI cert / inspection record → auto-attach to the right Supplier or Purchase Receipt + populate fields
- **verify-foreign-supplier** — given new vendor: look up FDA Food Facility Registration, GFSI scheme status, FDA import alert list, prior notice history; produce a draft Foreign Supplier Profile + risk score; flag anything anomalous
- **generate-fsvp-plan** — given (food, supplier) pair, draft the FSVP using per-category hazard analysis templates + per-food regulatory guidance; human reviews and approves
- **schedule-verification-activity** — risk-based reminder loop: "Mimi Foods audit due in 45 days; previous findings attached; here's a scheduling email draft for the auditor"
- **traceability-lookup** — given a complaint, recall notice, or pathogen test result: walk batch tracking forward (affected sales / customers) and backward (affected POs / suppliers) within the FSMA 204 24-hour window

The agent narrative is exactly the wedge: "stealth does the food-safety paperwork so the grocer doesn't have to."

## Strategic shape

Two-stage value path:

**Stage 1 — Internal LIM use.** Yemi has Reg# 10337671048; LIM imports from multiple foreign suppliers. Building the module for LIM's own compliance is the v0. Same way we're building procurement-agent for LIM first, then productizing later.

**Stage 2 — Diaspora-grocer product.** Package the module + the templates + the agent capabilities as a product. African and Caribbean food category coverage is the defensible niche — nobody else has built hazard templates for dried fish from Nigeria, palm oil from Ghana, fufu from Cameroon, scotch bonnet peppers, etc. Sales urgency: every grocer who's imported $1M+ a year is exposed and knows it.

## v1 scope sketch (3-4 months solo with aggressive LLM-driven dev)

1. Foreign Supplier Profile DocType + 11 Custom Fields on Supplier
2. Hazard Analysis DocType with templates for 20-30 common African/Caribbean food categories (researched + reviewed by a food safety consultant)
3. FSVP Plan DocType + Print Format (FDA-inspectable PDF)
4. Verification Activity DocType + risk-based reminder cron
5. Biennial Food Facility Registration renewal reminders
6. Three agent capabilities: classify-compliance-doc, verify-foreign-supplier, schedule-verification-activity

Defer: FSMA 204 traceability + Critical Tracking Events + recall management — these are real engineering and the regulatory deadlines have shifted; build them when ready, not on a moving target.

## Caveats

- **Regulatory adjacency.** This is compliance software. ToS must be precise: tool, not legal advice. Operator is the legally responsible party. Standard compliance-SaaS posture (Vanta, Drata, Secureframe). Food safety consultant involvement for template design is a real cost.
- **Don't start before Slice 1 ships.** This presupposes ERPNext is up + the Custom App pattern is in place. Building it before that is putting on the roof before the walls.
- **Licensing posture (ADR 0019) gets interesting if productized.** Two paths:
  - License the FSVP module under GPL v3 (most ERPNext-ecosystem apps do this)
  - Build as a separate Frappe app that requires only Frappe Framework (MIT) — would constrain DocType choices to avoid ERPNext-specific references; license however we want. More work, more flexibility.
  - Decide before any product launch.
- **FSMA 204 timing.** Pushed; landing 2026-2028 depending on category. Build because LIM needs it, not because of a deadline that might slip again.
- **Templates are the moat.** Anyone can copy the doctypes; the per-category African/Caribbean hazard templates with regulatory grounding are the defensible asset. Treat them as IP.

## When to revisit

Wait until **at least one of these is true**:

1. LIM is operating on ERPNext (Slice 1 + Slice 2 shipped); FSVP becomes the natural Slice 5 or Slice 6.
2. A second FDA inquiry or audit raises urgency to "must do internally now."
3. Yemi has 2-3 conversations with other diaspora grocers confirming they'd pay for this — validates the wedge.
4. FSMA 204 traceability deadline becomes firm and near (within 6 months).

Until then: don't start. The note exists; the architecture supports it; the time will tell.
