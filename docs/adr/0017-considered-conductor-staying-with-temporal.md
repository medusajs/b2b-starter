# Considered Conductor OSS for workflow orchestration; staying with Temporal

We evaluated Conductor OSS (Netflix-originated, Apache 2.0, with a first-class Claude Code / Cursor / Copilot skill and native LLM/MCP task types) as an alternative to Temporal Cloud for procurement-agent. Research showed Conductor wins clearly on first-pass LLM-generated workflows and AI-task ergonomics, but Temporal wins on TypeScript SDK maturity, testing primitives, replay correctness, and maintainability of code-heavy workflows — which is our shape. We stay with Temporal; the procurement-agent is code-heavy and domain-heavy, exactly the workload Conductor's own community framing says belongs in Temporal.

## Correction worth flagging

An earlier draft of this evaluation claimed Temporal TypeScript workflows can't use async/await, conditionals, or loops. **That was wrong — those constraints apply to Medusa workflow composition functions, not Temporal.** Temporal TS workflows are regular `async` functions with `if`/`else`; the real constraint is determinism (no direct I/O in workflow code, no `Math.random()` / `Date.now()` outside Temporal APIs, side effects belong in activities). This is a much easier mental model for LLMs than Medusa's composition rules, and substantially weakens what was previously framed as a Conductor advantage.

## Evidence

Generic blind comparison commissioned 2026-05-12. Key findings:

- **Temporal TS SDK**: ~838 stars, 54 commits in 90 days, mature `TestWorkflowEnvironment` + time-skipping test harness, idiomatic generic types throughout
- **Conductor JS SDK**: ~52 stars, 22 commits in 90 days, younger and stringly-typed at the workflow definition layer (expression strings like `"${task_ref.output.body.field}"`)
- **Workflow conciseness**: Conductor JSON is ~2.5× longer than equivalent Temporal TS for the same logic (verified by side-by-side order-approval example: ~80 lines JSON vs ~30 lines TS)
- **Conductor Skills**: installs cleanly into Claude Code/Cursor/Codex/Copilot and provides the LLM with workflow schemas + examples + ops scripts. Real win for first-pass workflow generation; doesn't change long-term maintainability.
- **AI task types**: Conductor's "14+ providers" marketing is actually 12 LLM providers + 3 vector DBs in source. Real, but more bounded than the marketing suggests.
- **Pricing**: Temporal Cloud Essentials ~$100/mo for 1M actions; our expected workload (~1.5M actions/mo) lands around $125/mo. Orkes managed pricing isn't public.

Independent agent bottom line: *"Prototype in Conductor if the workflow shape is mostly task graph + waits + LLM/tool calls. Choose Temporal if the workflow shape is code-heavy, domain-heavy, and likely to need long-term refactoring by TypeScript engineers."* Our procurement-agent is the second.

## When to reconsider

- LIM scales to 3+ AI agent flows where most coordination is task-graph-shaped (not code-shaped) and one JSON workflow per flow is cheaper than maintaining N TypeScript workflows
- Temporal Cloud monthly cost crosses a threshold worth migrating for (rough heuristic: ~$300+/mo)
- We want to expose "agent generates a workflow at runtime" capability to operators — Conductor's data-shape natively supports this; Temporal would need a code-generation layer
- Future workload becomes overwhelmingly LLM-task-orchestration rather than business-logic-heavy capability work

## Migration path if we revisit

Updated estimate: still mechanical, not architectural. ~80% of work unchanged — Medusa modules, capabilities' prompts/schemas/tools, FSM design, eval harness, cost instrumentation, the messaging service. 7 of 29 issues are engine-specific. Per-capability migration: swap SDK imports, restructure activities into Conductor task workers (regular polling loops), translate Temporal workflow code into JSON definitions (mechanical but verbose). Effort: 1-2 weeks fluent / 2-3 weeks learning.

**Cheapest migration windows**: right after C.1 (harness foundation) ships — the harness abstracts the engine; or before any production deploy locks operational workflow history.

## What we lose by staying with Temporal — and how to recover it

Conductor's strongest concrete advantage is its Claude Code skill — a packaged prompt + schema + examples bundle that makes LLM-driven workflow authoring fast. We can partially recapture this for Temporal by writing our own `AGENTS.md` or `temporal-conventions.md` describing the deterministic workflow rules + stealth's capability patterns + signal/activity examples. Not free; not a separate ADR; tracked outside this decision.
