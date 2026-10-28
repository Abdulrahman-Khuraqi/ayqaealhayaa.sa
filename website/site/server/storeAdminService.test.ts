import { describe, expect, it } from "vitest";
import { createOrderReference, storeContentDefaults, toHalalas, toMoney } from "./storeAdminService";

describe("store administration helpers", () => {
  it("keeps Saudi riyal values in halalas without floating point drift", () => {
    expect(toHalalas(99.99)).toBe(9999);
    expect(toMoney(9999)).toBe(99.99);
  });

  it("creates a distinct order reference and exposes only supported editable content defaults", () => {
    expect(createOrderReference(new Date("2026-09-02T00:00:00Z"))).toMatch(/^ORD-260902-[A-F0-9]{6}$/);
    expect(storeContentDefaults).toHaveProperty("contact_email");
    expect(storeContentDefaults).toHaveProperty("terms_full");
    expect(storeContentDefaults).not.toHaveProperty("admin_password");
  });
});
