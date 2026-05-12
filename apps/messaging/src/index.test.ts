import { describe, it, expect } from "vitest";
import { buildApp, MESSAGING_APP_NAME } from "./index.js";

describe("messaging app", () => {
  it("exports the app name", () => {
    expect(MESSAGING_APP_NAME).toBe("messaging");
  });

  it("responds 200 OK on /health", async () => {
    const app = buildApp();
    try {
      const res = await app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: "ok" });
    } finally {
      await app.close();
    }
  });
});
