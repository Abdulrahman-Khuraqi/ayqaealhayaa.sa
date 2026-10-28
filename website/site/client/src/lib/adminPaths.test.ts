import { describe, expect, it } from "vitest";
import { ADMIN_ENTRY_PATH, ADMIN_HOME_PATH } from "./adminPaths";

describe("admin paths", () => {
  it("uses the complete store-management screen as the initial admin destination", () => {
    expect(ADMIN_HOME_PATH).toBe("/admin/store");
  });

  it("exposes a short public entry path for the administrative login", () => {
    expect(ADMIN_ENTRY_PATH).toBe("/admin");
  });
});
