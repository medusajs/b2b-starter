# Workflow-driven agentic architecture; autonomous-agent territory reserved

LLM-using capabilities in this system are **leaf-level Temporal activities** invoked at deterministic points in the FSM, not autonomous agents reasoning over what the system should do next. Each capability has a typed input, a structured output, optional read-only tool access, and lives in `src/agents/{capability}/`. Temporal owns orchestration; LLMs do focused judgment.

**Considered alternative — autonomous agent with tools** (a higher-level agent given a goal like "process this inbound email" and tools like DB queries, send-email, slack-post, decides what to do next). Rejected because every "agent task" in this system has a deterministic invocation point already encoded in the FSM. An autonomous agent on top would be re-reasoning about flow that workflow code already specifies. Replay determinism becomes fuzzy, audit story weakens (decision logic split between code and prompts), cost becomes unpredictable (agents loop).

**The (γ) call shape:** within each capability, the activity wrapper does deterministic preparation (DB queries, fuzzy matching, building candidate sets) before the LLM call. The LLM call is the part that genuinely requires judgment (composition, classification, structured extraction). Read-only tools are exposed where the LLM benefits from open-ended exploration the wrapper can't predict. Writes (DB, email, Slack, QBO) happen at the activity level after the LLM returns structured output — never from inside the LLM step. This preserves the audit story.

**Reserved (c)-territory** (autonomous-agent-with-tools graduation when these flows activate post-v0):
- Disputed-state resolution in Pay phase (multi-input reasoning over bill, receipt, credit memo, thread)
- Cross-PO bill handling (vendor consolidates multiple POs)
- Bill anomaly investigation (formats the deterministic pipeline can't parse cleanly)
- Vendor relationship intelligence (cross-PO patterns, autonomous chase reasoning)

**Trade-off accepted:** less flexibility to handle novel orchestration patterns. The orchestration is enumerable here, so flexibility costs more than it buys. Graduation paths are explicit, narrow, and case-by-case — not a system-wide architectural shift.
