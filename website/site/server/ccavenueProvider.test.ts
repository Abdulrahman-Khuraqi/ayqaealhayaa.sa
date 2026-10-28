import { describe, expect, it } from "vitest";
import { decryptCCAvenueResponse, encryptCCAvenueRequest, parseCCAvenueResponse, validateCCAvenueResponse } from "./ccavenueProvider";

describe("CCAvenue encrypted checkout", () => {
  it("round-trips an encrypted provider response and validates it against the expected invoice", () => {
    const encryptionKey = "test-only-working-key";
    const plainResponse = "order_id=IH-20260904-ABC123&merchant_param1=inv_test_1234567890&order_status=Success&amount=125.00&currency=SAR&tracking_id=123456789012";
    const response = parseCCAvenueResponse(decryptCCAvenueResponse(encryptCCAvenueRequest(plainResponse, encryptionKey), encryptionKey));

    expect(response.order_status).toBe("Success");
    expect(validateCCAvenueResponse(response, {
      reference: "IH-20260904-ABC123",
      publicId: "inv_test_1234567890",
      amountHalalas: 12_500,
      currency: "SAR",
    })).toBe(true);
  });

  it("rejects a response that does not match the invoice amount or reference", () => {
    const response = parseCCAvenueResponse("order_id=OTHER&merchant_param1=inv_test_1234567890&amount=124.99&currency=SAR");
    expect(validateCCAvenueResponse(response, {
      reference: "IH-20260904-ABC123",
      publicId: "inv_test_1234567890",
      amountHalalas: 12_500,
      currency: "SAR",
    })).toBe(false);
  });
});
