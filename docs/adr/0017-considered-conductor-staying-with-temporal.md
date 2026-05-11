# Considered Conductor OSS for workflow orchestration; staying with Temporal

Stealth's runtime stack chose Temporal Cloud (ADR 0002) and the merged platform inherits that choice (ADR 0007, ADR 0010). Conductor OSS — Netflix-originated, Orkes-maintained, Apache 2.0 — offers a credible alternative with native LLM/MCP orchestration, JSON workflow definitions, and easier self-hosting. We evaluated it and chose to stay with Temporal because the sunk investment is real, the TS SDK ergonomics are meaningfully better for our team size (solo dev with established Temporal mental model), and Conductor's strongest differentiator (AI-native task types for 14+ LLM providers + MCP tools) is something we'd want to wrap with our own harness (Langfuse, cost instrumentation, eval framework) anyway. Recording this decision so the trade-off is explicit, not implicit.

## What Conductor would buy us

- **Apache 2.0 throughout** (Temporal: OSS for self-host, Cloud is commercial)
- **Easier self-hosting** (single Docker image + Postgres vs Temporal's multi-service architecture)
- **Native LLM task types** for 14+ providers and MCP tools
- **JSON workflow definitions** that LLMs can generate at runtime — relevant for "agent generates a workflow" scenarios (Slice 6+, hypothetical)
- **First-class Human Task primitive** for in-UI approval workflows
- **7 polyglot SDKs** (Temporal: ~5)
- **Battle-tested at Netflix / Tesla / LinkedIn / JP Morgan** (Temporal: Stripe / Coinbase / Snap)

## What Temporal keeps for us

- **Mature TypeScript SDK** with `@temporalio/testing` in-process server (Conductor's TS support is workable but less polished)
- **Workflows as code** beats workflows as JSON for our solo-dev velocity
- **Temporal Cloud** mature managed offering; Orkes managed is newer
- **Stealth's existing codebase** (capabilities scaffolded against Temporal activities, ADRs already written)
- **Coexistence pattern** (ADR 0013) maps cleanly to Temporal signals; Conductor's Human Task is shaped for "approve in UI" not "Medusa event → workflow signal"

## When to reconsider

- Temporal Cloud monthly cost exceeds a threshold worth migrating for (rough heuristic: >$200/mo)
- LIM scales to 3+ AI agent flows and we want JSON-defined cross-agent orchestration cheaper than code-based
- Compliance or cost requires full self-hosting; Conductor is operationally cheaper to self-host than Temporal
- We want to expose "agent generates a new workflow" capability to operators (LLM-authored JSON workflows)

## Migration path if we revisit

The migration is **mechanical, not architectural** — the activity-and-workflow shape is the same in both engines; only the SDK and workflow-definition format change.

**What stays unchanged (~80% of the work)**:

- All Medusa modules (vendor / item / purchaseOrder / activityLog / attachment / productProcurement / vendorItem)
- The messaging service and all channel adapters
- Capability prompts, Zod schemas, read-only tools (the AI logic itself)
- ADR 0016 capability shape — only the activity wrapper file changes per capability
- Place / Receive / Pay FSM design
- Coexistence pattern (ADR 0013) — pattern is identical; implementation detail differs
- Cost & budget instrumentation, eval harness, Langfuse
- ~26 of the 29 vertical-slice issues (only the procurement-agent runtime issues are engine-specific)

**What changes**:

- `apps/procurement-agent/src/workflows/*.ts` — rewrite as Conductor JSON workflow definitions (Switch, Wait, SUB_WORKFLOW operators replace TS workflow code)
- `apps/procurement-agent/src/activities/*.ts` → `apps/procurement-agent/src/workers/*.ts` — task worker pattern (polling loops) replaces Temporal activity registration
- `apps/procurement-agent/src/agents/*/activity.ts` — swap Temporal SDK imports for Conductor SDK imports; logic stays
- `apps/procurement-agent/src/clients/temporal.ts` → `clients/conductor.ts`
- `apps/procurement-agent/src/worker.ts` — entry-point rewrite for Conductor's poll-based worker model
- `apps/procurement-agent/src/subscribers/medusa-event.ts` — Medusa event → Conductor task completion event (different mechanism, same semantic)
- `apps/procurement-agent/src/lib/idempotency.ts` — derivation switches from Temporal activity attempt ID to Conductor task reference name + dedup keys
- Tests using `@temporalio/testing` → Conductor's local-server testing pattern (docker-compose conductor-server + Postgres)
- Supersede ADRs 0002, 0007, 0010, 0016

**Effort estimate**: 1-2 weeks of focused work for someone fluent in both engines; 2-3 weeks for someone learning Conductor as they go.

**Migration timing — cheapest windows**:

1. **Right after C.1 ships (harness foundation)** — the harness abstracts the engine, so swapping under it is cleanest
2. **Before Slice 2 (Receive) starts** — each new phase adds more workflow code to port
3. **Before C.10 (production deploy)** — once the worker is in prod and running real PO workflows, operational migration is more disruptive (export workflow history + restart strategy)

**Migration timing — most expensive windows**:

1. **After 6+ months of production runs** — accumulated execution history needs a strategy (export-and-replay vs accept loss and start fresh)
2. **After multiple agent flows ship** — each agent adds workflow code to port
3. **Mid-Slice during active development of a phase** — coordinate during a planning window, not mid-sprint

**Risk profile**:

- **LOW** for data model and business logic (untouched)
- **MEDIUM** for workflow logic correctness (FSM transitions and signal handling need careful porting)
- **MEDIUM** for the test harness (eval framework needs to work with new test setup)
- **HIGH (week 1 of migration)** for deployment infra if we self-host Conductor (new server + Postgres setup; mitigated by using Orkes managed initially)
