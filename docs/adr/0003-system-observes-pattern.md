# System observes, infers, acts — humans are not data-entry layers

**The principle:** the system prefers to *infer, find, and do* rather than wait for explicit human-driven state updates. Buttons, slash commands, and `[Mark X manually]` affordances exist as escape hatches; they are never the primary path.

**Where this shapes the design:**
- **Receive arrivals.** The bot proactively prompts on `expected_delivery` rather than waiting to be told. Natural-language messages from the owner ("Ilham order came in") are an equal-primary path, not a fallback.
- **Cancellations.** The classifier observes the owner's outbound cancel email (via the `procurement@` CC) and infers the cancel event. The owner does not have to also mark cancelled in our system after telling the vendor. Slack-driven cancel exists for the rare phone-only case.
- **Payments.** QBO is the source of truth (see ADR-0005); a watcher fires `payment_initiated` and `payment_clears` from observed QBO state, not from a `[Mark Paid]` button.
- **Inbound vendor signals.** The email classifier auto-fires transitions across Place and Pay; humans only confirm hard-to-reverse terminal moves (see ADR-0004).

**Why it matters as a design value, not just a UX choice:** double-work erodes trust in the system. If the owner has to email the vendor *and* update the system, she will eventually skip the system update — and the FSM will silently drift from reality. The cure is to remove the second action: observe the first one, infer the consequence.

**Trade-off:** building the observation paths is more upfront work than offering a `[Mark]` button. Some observations are imperfect (latency, classifier confidence, missed signals). The escape hatches stay around for those cases — but they're documented as escape hatches, not as the canonical flow.
