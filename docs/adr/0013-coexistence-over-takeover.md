# Coexistence over takeover: the agent reads state, never claims it

The agent (stealth) and human operators (Yemi, Grace) must be able to act on the same entities at the same time without conflict UI. Take-over buttons, pessimistic locks, and "pause agent on this PO" controls are operationally hostile — operators should be able to just go do the thing.

**Decision.** There is no take-over mechanism in the platform. Every Temporal activity re-reads current state at every decision point before committing (pessimistic reads). State-mutating workflows are idempotent — two callers racing toward the same end state both succeed; the second is a no-op. A Medusa-event-to-Temporal-signal subscriber translates state changes into signals so long-running agent workflows notice human edits and adapt or exit cleanly. Per-vendor `agent_authority` (see ADR 0015) controls what the agent may commit autonomously — but it is a configuration, not a take-over mechanism.

## Consequences

- The agent's draft-then-send activities must diff-detect against current state before sending. If the PO changed after drafting, the default is to discard the draft (Yemi has moved the conversation forward) rather than send stale content.
- Every state-transition workflow must be safe under concurrent invocation; this is enforced at the workflow level, not the application level.
