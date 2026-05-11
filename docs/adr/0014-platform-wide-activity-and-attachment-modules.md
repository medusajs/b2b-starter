# Activity log and attachment storage are platform-wide, not procurement-specific

The procurement slice initially designed `procurementEvent` and `procurementFile` modules to record agent/human activity and store file metadata. Every future agent flow (catalog-health, accounting, customer-support, inventory) wants the same shape — an immutable timeline keyed by target entity, and a deduplicated file store linked many-to-many to anything. Splitting per-domain would force every new agent to re-implement the same primitives.

**Decision.** Replace `procurementEvent` with a platform-wide `activityLog` module (entity: `Activity`), and replace `procurementFile` with a platform-wide `attachment` module (entities: `Attachment` + `AttachmentLink`). Both use polymorphic `target_entity_type` + `target_entity_id` columns instead of per-domain foreign keys, so any future module can target them without schema migration. Domain-specific `event_type` and `file_kind` values are validated against per-domain TypeScript registries (split into files like `event-types/procurement.ts`, `event-types/catalog-health.ts`) — adding a new event type is a code change, not a DB migration.

## Considered alternatives

- **Per-domain event/file modules** (rejected) — every new agent would need to build the same primitives; admin UI activity feeds would have to UNION across N tables.
- **Nullable per-domain FK columns on a single Event table** — works for 3 target types but becomes wasteful sparse columns past 10+. Polymorphic target with composite index is cheaper at scale.
- **Drop module-level `defineLink` to target entities** (accepted as cost of polymorphic targets) — admin queries for "timeline of this entity" are single-module filters on Activity, which don't need cross-module Index Module support. Inverse queries are rare and can use raw SQL when needed.
