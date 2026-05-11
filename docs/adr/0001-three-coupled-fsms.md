# Three coupled FSMs, not one unified state machine

The PO lifecycle from order to payment is modeled as three separate state machines — **Place**, **Receive**, **Pay** — coupled by `purchase_order_id` and ordered transitions, rather than one mega-FSM that encodes every state from every phase.

Each phase answers a distinct question (did we agree? did goods arrive correctly? did we settle the bill?), has different actors, different time horizons (hours/days → days/weeks → weeks/months), and different failure modes. Forcing them into a single FSM produced a state space too large to reason about, with transitions that didn't compose cleanly across phase boundaries (e.g., post-Confirmed reneges from a vendor are a Receive concern, not a re-opening of Place). Three small comprehensible FSMs beat one unmanageable one.

The trade-off accepted: cross-phase queries ("where is PO 142 across all three phases?") require reading three status fields instead of one — handled by exposing `status_place`, `status_receive`, `status_pay` as separate columns on `purchase_order` (NULL until that phase starts), with the parent Temporal workflow as the canonical orchestrator.
