# Pinned curated tone references; no recency-based RAG for vendor email tone

Each `Vendor` row carries `tone_reference_email_id` — a single FK to the one curated past outbound email picked by hand as the canonical tone for emails to that vendor. Vendor-facing email-drafting capabilities (Place drafting, edit handling, cancel / credit-request / chase drafts) use this pinned reference for tone calibration. Recent thread messages are loaded *separately* in the prompt, with explicit instruction NOT to imitate their tone — they're conversational context, not style templates.

**Considered alternative — pull the last N outbound emails to the vendor as few-shot tone examples** (recency-based retrieval). Rejected because of a corruption cascade:

1. A bad outbound goes out (rushed day, terse tone).
2. Next draft pulls it as "recent example"; LLM imitates the curt tone.
3. Human approves (often skimming).
4. There are now two curt examples in the recency window.
5. The next draft is curt-er.
6. Quality silently degrades over time, with no self-correction signal.

Recency has no quality gate. Embeddings (semantic similarity) don't fix this either — they retrieve "most similar" without quality scoring; a bad email is still in the candidate set.

**Pinned references break the cascade** because no recent email can promote itself into the tone-reference seat without explicit human action. Quality is locked at curation time and stable until manually re-pinned.

**Trade-off accepted:** ~30 minutes of curator time during catalog ETL (top 10 vendors), ~2 minutes per new vendor going forward, plus a quarterly review reminder. In exchange: drift-free tone quality across the system's lifetime.

**When `tone_reference_email_id` is NULL** (new vendor not yet curated): fall back to a generic professional-but-warm prompt. No corruption risk because there's no prior bad example to inherit from.

**Schema addition:** `vendor.tone_reference_email_id uuid nullable FK to file`.

**Scope note:** this ADR applies only to vendor-facing email composition. Bill parsing, classifiers, fuzzy matching, and Slack intent do not use few-shot examples — they're structured-extraction or classification tasks; LLMs handle them from generic prompts without per-vendor context. The corruption-cascade reasoning does not generalize to those capabilities.
