# Auto-fire transitions; trust downstream gates to catch errors

**Decision:** classifier-driven events auto-fire on the FSM without a per-event confirmation gate. The only exception is `vendor_reneges`, which is **card-and-confirm** because it transitions to a terminal state (`Vendor Cancelled`) with no downstream gate.

**Why:** every payment-flow event has a *downstream* human gate that catches misclassification. A wrong `bill_matches_received` is caught when the human reviews the payment confirmation at `payment_initiated`. A wrong `bill_exceeds_received` is caught when the human reviews the credit-request email draft before send (Place-pattern). A wrong `bill_below_received` lands in `Disputed`, which is itself a human-driven state by definition. Gating *every* event additionally on a Slack confirmation introduces friction that buys nothing — the gates already exist where they actually catch errors.

**The original instinct was wrong:** the first design called for card-and-confirm on all three bill-reconciliation events under the reasoning "money is involved." But money doesn't move at any of those events — it moves at `payment_initiated`. Reconciliation events just route the PO to the right next-state; the gate that prevents wrong payments is downstream.

**The pattern in one line:** the AI does the work, downstream human gates catch the errors. Notifications keep humans aware of every transition; gates only exist where consequences are hard to undo.

**Card-and-confirm criterion:** an event is card-and-confirm if and only if it transitions to a terminal state with no further human-gated transition out of it. Today only `vendor_reneges` qualifies. Future additions should be evaluated against the same criterion.
