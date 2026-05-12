// Public entrypoint for the messaging service package.
// The HTTP server lives in src/server.ts; src/app.ts builds the Fastify instance
// (kept separate so tests can use Fastify's `inject` API without binding a port).
export const MESSAGING_APP_NAME = "messaging";

export { buildApp } from "./app.js";
