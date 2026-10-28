import { describe, expect, it } from "vitest";
import { UnconfiguredPaymentProvider } from "./paymentProvider";

describe("unconfigured payment provider", () => {
  it("never exposes a payment URL before a licensed provider is configured", async () => {
    const provider = new UnconfiguredPaymentProvider();
    const result = await provider.createHostedInvoice({
      reference: "IH-20260902-ABC123",
      amountHalalas: 2500,
      currency: "SAR",
      description: "فاتورة اختبار",
      successUrl: "https://ayqaealhayaa.sa/payment/success",
      cancelUrl: "https://ayqaealhayaa.sa/payment/cancel",
      callbackUrl: "https://ayqaealhayaa.sa/api/payment-links/v1/callbacks/provider",
      customer: { name: "عميل اختبار" },
    });

    expect(result.activationState).toBe("unconfigured");
    expect(result.paymentUrl).toBeNull();
  });

  it("rejects every webhook until the selected provider can verify its signature", async () => {
    const provider = new UnconfiguredPaymentProvider();
    const event = await provider.verifyWebhook({ status: "paid" }, "untrusted-signature");
    expect(event.verified).toBe(false);
  });
});
