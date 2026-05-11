# External system integrations are abstracted by `system` enum, not vendor-named modules

The platform integrates with multiple external systems per domain: email / SMS / WhatsApp / Slack / voice for messaging; Toast / Clover / Square for POS; QBO / Xero for accounting; Melio / Stripe for bill pay. Modeling each integration as its own module creates parallel schemas, tight coupling to specific vendor names, and a migration on every new integration.

**Decision.** Every cross-system domain uses a single module with a discriminator enum (`channel` for messaging, `system` everywhere else) + a `system_payload` jsonb for vendor-specific data. Adapter code dispatches by enum value. Adding a new integration = extend the enum + write an adapter; no schema migration. No third-party vendor name (Toast, QBO, Melio, Twilio, Slack, etc.) appears anywhere in module, entity, or workflow names — they appear only as enum values inside a generic schema.
