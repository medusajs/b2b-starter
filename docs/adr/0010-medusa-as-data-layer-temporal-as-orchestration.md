# Medusa as data layer, Temporal as orchestration

The platform needs both transactional data persistence and long-running orchestration that spans days — a PO lives across Place → Receive → Pay phases over weeks, and a vendor confirmation may arrive three days after the PO is sent. Medusa workflows run to completion and can't suspend mid-flight; Temporal Cloud handles week-long orchestration durably; the two have different jobs.

**Decision.** Medusa owns all data + transactional commits via Medusa workflows. Temporal Cloud owns long-running orchestration via parent + Place/Receive/Pay child workflows. Each Temporal activity ends with a deterministic write phase that calls Medusa workflows (for procurement state) or the messaging service API (for messages) — activities never write directly to DBs they don't own. The procurement-agent app is a separate Temporal worker process; it reads Medusa data via the admin SDK and reacts to Medusa state-change events via a subscriber that translates them into Temporal signals.

## Considered alternatives

- **All workflows in Medusa** (rejected) — Medusa workflow composition functions don't allow conditionals/loops/async/spread; per-step checkpointing isn't granular enough for AI tool loops where each LLM call is expensive to retry.
- **All workflows in Temporal, no Medusa** (rejected) — would lose Medusa's admin UI, module isolation, B2B starter modules (Company / Quote / Approval), and forces us to re-implement transactional commits with rollback.
