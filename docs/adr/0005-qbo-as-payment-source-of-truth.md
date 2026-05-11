# QuickBooks Online is the source of truth for payment, not Melio (or any payment processor)

**Decision:** the system writes to QBO (creates the Bill record on `bill_arrives`) and watches QBO (polls for bill payments) to drive Pay-phase state. The system does **not** integrate with Melio's payment API to send money. The owner pays through her existing flow (Melio, ACH, check — whatever); the system observes the payment via QBO.

**Considered alternatives:**
- **Full Melio API integration.** Agent prepares + sends payment via Melio API; webhooks report `payment_clears` / `payment_fails`. Closed loop, fastest signal. Rejected because: agent moves money (highest trust requirement, highest blast radius bug); locks the owner into Melio specifically; doesn't deliver the bonus value of auto-bookkeeping; QBO would still need separate write-through for accounting.
- **Human-in-the-loop with Melio.** Agent prepares, human approves before Melio API call. Same lock-in concerns; less blast-radius reduction.
- **System tracks; human marks paid manually.** Owner pays externally, clicks `[Mark Paid]` in Slack. Rejected because it makes the human a data-entry layer (see ADR-0003).

**Why QBO won:**
1. **Lower blast radius.** The agent never moves money. Worst-case bug is a wrong QBO entry, fixable in QBO's UI.
2. **Payment-method-agnostic.** Owner can pay via Melio, ACH, check, wire — the system stays informed via QBO regardless.
3. **QBO is already the books.** Tying our FSM to QBO state aligns the system with what's authoritative for accounting; no two-source-of-truth reconciliation.
4. **Bonus value.** Auto-creating QBO Bills from inbound bill PDFs saves real bookkeeping time the owner does today by hand.
5. **Owner workflow doesn't change.** No new buttons in our system at the money-movement step. She pays the way she always has.

**Trade-off accepted:** payment-state latency in our FSM lags by however long QBO bookkeeping lags (hours to a few days). Mitigated by pg_cron chase prompts on POs sitting in `Ready to Pay` past a threshold, plus a `[Mark paid manually]` escape hatch for emergencies.

**Lock-in:** the QBO MCP integration. If LIM ever moves off QBO, the watcher and bill-creation paths need replacing — but the events table and FSM design are untouched, so the migration is constrained to one subsystem.
