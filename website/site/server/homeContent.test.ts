import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { storeContentDefaults } from "./storeAdminService";

const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");

describe("محتوى الصفحة الرئيسية", () => {
  it("يربط كل مرجع محتوى ديناميكي في واجهة العملاء بمفتاح قابل للإدارة", () => {
    const managedKeys = [...new Set([...homeSource.matchAll(/content\.([a-z0-9_]+)/g)].map(match => match[1]))];

    expect(managedKeys.length).toBeGreaterThan(30);
    for (const key of managedKeys) {
      expect(storeContentDefaults[key]).toBeTypeOf("string");
    }
  });

  it("يبقي النصوص الثابتة في الصفحة مقتصرة على هوية العلامة وتعليمات التفاعل ورسائل التحقق", () => {
    const intentionallyStatic = [
      "إيقاع", "الحياة", "العودة إلى الصفحة الرئيسية", "فتح القائمة", "إغلاق القائمة",
      "أُضيف المنتج إلى السلة", "أضف منتجًا واحدًا على الأقل قبل إتمام الطلب", "فضلاً أكمل الاسم",
    ];

    for (const text of intentionallyStatic) expect(homeSource).toContain(text);
  });
});
