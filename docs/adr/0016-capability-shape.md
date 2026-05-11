# Capability shape: prompt + Zod schema + read-only tools + Temporal activity wrapper

Stealth's agent code uses a consistent "capability" pattern — one folder per capability with a prompt, a Zod schema for structured output, optional read-only tools, and an activity wrapper. Without making this pattern explicit, every future capability port (and every future agent) would re-derive it, leading to drift.

**Decision.** A capability is one focused LLM-using job. Each capability folder under `apps/procurement-agent/src/agents/<name>/` contains:

1. **`prompt.ts`** — exports the system prompt as a function `(input, context) => string`. Tone reference, vendor data, and other variable inputs are interpolated here. Prompt version is tracked in the export (e.g., `export const VERSION = "0.1.2"`).
2. **`schema.ts`** — exports a Zod schema for the LLM's structured output. The schema's inferred type is the activity's return value.
3. **`tools.ts`** *(optional)* — exports typed read-only tools the LLM can call during reasoning. Each tool has a Zod input schema, returns structured data via Medusa SDK or messaging-service API, and **never writes**. Writes happen at the activity level after the LLM returns.
4. **`activity.ts`** — exports the Temporal activity. The activity does: deterministic prep (DB queries, fuzzy match) → invokes the LLM via AI Gateway with prompt + schema + tools → validates structured output against the schema → performs Medusa-workflow / messaging-API writes with idempotency_key derived from Temporal activity ID. The activity ends with a `recordActivityStep` call so every capability call shows up in the activity log with `source='agent'` and `actor_id=<capability>@<version>`.
5. **`activity.test.ts`** — fixture-driven Vitest tests with golden-output snapshots (see ADR for eval harness when written).

The harness (`apps/procurement-agent/src/lib/`) provides the typed helpers: `aiGateway`, `langfuseTrace`, `idempotencyKey`, `recordActivity`. New capabilities don't reinvent these.

## Consequences

- Adding a new capability means filling the four files above; everything else is the harness's job.
- Capability versioning is filesystem-level for v1 (file edit + `VERSION` bump); runtime A/B versioning is deferred.
- Tools are read-only by contract. Any "write" through a tool is a bug — writes happen in the activity's post-LLM phase, never inside the LLM's tool-call loop.
