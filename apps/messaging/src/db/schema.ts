import { pgSchema } from "drizzle-orm/pg-core";

/**
 * All messaging tables live under the dedicated `messaging` Postgres schema
 * inside the shared Supabase database. Per ADR 0011, channel-specific data
 * (email, sms, whatsapp, slack, voice, manual, photo) is discriminated by a
 * `channel` enum on a generic message table — no vendor names appear in
 * table, column, or module names. Per ADR 0014, activityLog/attachment for
 * the broader platform live in Medusa; only messaging-domain attachments
 * (e.g. inbound email attachments referenced by message id) belong here.
 *
 * This file is intentionally empty in B.0. B.1 (#7) will populate it with
 * the channel enum, inbound_message, and outbound_message tables.
 */
export const messagingSchema = pgSchema("messaging");
