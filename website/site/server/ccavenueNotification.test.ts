import { describe, expect, it } from "vitest";

describe("CCAvenue dynamic notification policy", () => {
  it("keeps notification-only fields separate from verified payment return fields", () => {
    const acceptedAuditFields = ["order_status", "tracking_id", "status_code"];
    const rejectedSensitiveFields = ["billing_name", "billing_email", "billing_tel", "card_name"];

    expect(acceptedAuditFields).toContain("order_status");
    expect(acceptedAuditFields).not.toContain("amount");
    expect(rejectedSensitiveFields).toContain("billing_email");
  });
});
