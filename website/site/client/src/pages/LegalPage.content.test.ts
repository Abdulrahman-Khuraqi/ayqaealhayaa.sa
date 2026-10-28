import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { storeContentDefaults } from "../../../server/storeAdminService";

const legalPageSource = readFileSync(new URL("./LegalPage.tsx", import.meta.url), "utf8");

describe("بيانات المتجر القانونية", () => {
  it("يعرض بيانات الشحن والعنوان والسجل التجاري من محتوى الإدارة", () => {
    const managedKeys = [
      "shipping_notice",
      "business_address_label",
      "business_address",
      "commercial_registration_label",
      "commercial_registration",
    ];

    for (const key of managedKeys) {
      expect(storeContentDefaults[key]).toBeTypeOf("string");
      expect(legalPageSource).toContain(`content.${key}`);
    }
  });
});
