import { describe, it, expect } from "vitest";
import { MESSAGING_APP_NAME } from "./index";

describe("messaging stub", () => {
  it("exports the app name", () => {
    expect(MESSAGING_APP_NAME).toBe("messaging");
  });
});
