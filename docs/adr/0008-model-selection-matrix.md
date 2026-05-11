# Model selection matrix per capability

Each LLM-using capability declares its model explicitly via Vercel AI Gateway configuration. We do **not** default to one model across the system; the cost/quality calibration per task is meaningful at any volume.

| Capability | Model |
|---|---|
| Slack intent classifier | Kimi K2.6 |
| Vendor / item fuzzy match | Kimi K2.6 |
| Outbound email classifier | Kimi K2.6 |
| Inbound email classifier | Kimi K2.6 |
| Bill PDF parsing | Sonnet 4.6 |
| Place drafting | Sonnet 4.6 |
| Edit handling | Sonnet 4.6 |
| Cancel / credit-request / chase drafts | Sonnet 4.6 |
| Reserved for (c)-territory (Disputed-state resolution, anomaly investigation, vendor relationship intelligence) | Opus 4.7 |

**Why Kimi K2.6 for classifiers + parsing:** cheaper than Haiku 4.5 (input $0.60 vs. $1.00 per million tokens; output $2.50 vs. $5.00) with strong structured-output and classification accuracy. Errors are recoverable downstream via the auto-fire policy + downstream gates (ADR-0004); not worth Sonnet pricing on a routing call that will be re-checked at the next state's gate anyway.

**Why Sonnet 4.6 for bill parsing:** parsing errors propagate directly into money flow (wrong reconciliation → wrong credit request or wrong payment). Conservative model choice. Kimi could likely handle structured extraction but the asymmetric risk favors Sonnet at v0.

**Why Sonnet 4.6 for vendor-facing drafts:** tone, warmth, and prose quality matter for vendor relationships. Kimi K2.6's published benchmarks are coding-weighted; no public evidence yet for warm-vendor-email composition. Default to Sonnet; A/B Kimi post-v0 to see if it can graduate into these seats.

**Why Opus 4.7 reserved (not used in v0):** quality margin over Sonnet on these tasks doesn't justify ~2× cost at v0 volume. Reserved for genuinely hard reasoning tasks that activate later (the (c)-territory in ADR-0007).

**Lock-in is small:** model swaps are config edits via the AI Gateway, not code rewrites. When Sonnet 4.7 ships and is strictly better, the upgrade is one PR. When Kimi K2.7 outperforms Sonnet on prose, graduate per capability.

**Considered alternative — single-model (Sonnet for everything):** simpler operationally; ~5× the cost on capabilities where Kimi is sufficient. At any meaningful volume, the matrix saves real money; the simplicity isn't worth the markup. Rejected.
