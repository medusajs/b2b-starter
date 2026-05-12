import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["messaging"],
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? "",
  },
  strict: true,
  verbose: true,
});
