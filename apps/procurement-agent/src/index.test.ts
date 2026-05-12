import { describe, it, expect } from "vitest";
import { PROCUREMENT_AGENT_APP_NAME } from "./index";

describe("procurement-agent stub", () => {
  it("exports the app name", () => {
    expect(PROCUREMENT_AGENT_APP_NAME).toBe("procurement-agent");
  });
});
