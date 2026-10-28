import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { storeContentDefaults } from "../../../server/storeAdminService";

// The page shell lives in shared components, so the managed keys are spread across these files.
const homeSource = ["./Home.tsx", "../components/SiteLayout.tsx", "../components/SiteSections.tsx", "../lib/siteData.ts"]
  .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
  .join("\n");

describe("محتوى الصفحة الرئيسية", () => {
  it("يربط النصوص التجارية الرئيسية والتسميات القابلة للتحرير بقيم إدارة المتجر", () => {
    const managedKeys = [
      "hero_title", "nav_services", "nav_order", "products_title", "process_title",
      "contact_title", "cart_title", "legal_terms_label", "footer_rights", "footer_country",
      "shipping_notice", "business_address", "commercial_registration",
    ];

    for (const key of managedKeys) {
      expect(storeContentDefaults[key]).toBeTypeOf("string");
      expect(homeSource).toContain(`content.${key}`);
    }
  });
});
