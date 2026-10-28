import { describe, expect, it } from "vitest";
import { buildInvoiceReference, canActivateInvoiceForProvider, canManuallySetInvoiceStatus, createRawIntegrationKey, hashIntegrationKey, toHalalas } from "./invoiceService";

describe("invoice helpers", () => {
  it("converts Saudi riyals to halalas without floating point drift", () => {
    expect(toHalalas(10.5)).toBe(1050);
    expect(toHalalas(0.01)).toBe(1);
  });

  it("rejects non-positive invoice amounts", () => {
    expect(() => toHalalas(0)).toThrow();
    expect(() => toHalalas(-12)).toThrow();
  });

  it("creates references with the إيقاع الحياة prefix and the issue date", () => {
    const reference = buildInvoiceReference(new Date("2026-09-02T00:00:00.000Z"));
    expect(reference).toMatch(/^IH-20260902-[A-F0-9]{6}$/);
  });

  it("creates opaque integration keys and one-way hashes", () => {
    const key = createRawIntegrationKey();
    expect(key).toMatch(/^ih_live_/);
    expect(hashIntegrationKey(key)).toHaveLength(64);
    expect(hashIntegrationKey(key)).not.toBe(key);
  });

  it("allows only deliberate manual invoice status transitions", () => {
    expect(canManuallySetInvoiceStatus("draft", "pending")).toBe(true);
    expect(canManuallySetInvoiceStatus("pending", "paid")).toBe(true);
    expect(canManuallySetInvoiceStatus("pending", "cancelled")).toBe(true);
    expect(canManuallySetInvoiceStatus("paid", "pending")).toBe(false);
    expect(canManuallySetInvoiceStatus("cancelled", "paid")).toBe(false);
  });

  it("allows provider activation only for unpaid invoices that can receive a new payment link", () => {
    expect(canActivateInvoiceForProvider("draft")).toBe(true);
    expect(canActivateInvoiceForProvider("failed")).toBe(true);
    expect(canActivateInvoiceForProvider("pending")).toBe(false);
    expect(canActivateInvoiceForProvider("paid")).toBe(false);
  });
});
