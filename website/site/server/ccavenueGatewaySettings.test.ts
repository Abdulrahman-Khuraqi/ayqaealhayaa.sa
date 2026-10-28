import { describe, expect, it } from "vitest";
import { decryptCCAvenueCredentials, encryptCCAvenueCredentials } from "./ccavenueGatewaySettings";

describe("CCAvenue encrypted gateway settings", () => {
  it("encrypts credentials without leaving their plaintext values in the stored payload", () => {
    const credentials = { merchantId: "merchant-123", accessCode: "access-456", encryptionKey: "working-key-789" };
    const payload = encryptCCAvenueCredentials(credentials, "test-master-secret");

    expect(payload).not.toContain(credentials.merchantId);
    expect(payload).not.toContain(credentials.accessCode);
    expect(payload).not.toContain(credentials.encryptionKey);
    expect(decryptCCAvenueCredentials(payload, "test-master-secret")).toEqual(credentials);
  });

  it("rejects a payload when the wrong server key is used", () => {
    const payload = encryptCCAvenueCredentials({ merchantId: "merchant-123", accessCode: "access-456", encryptionKey: "working-key-789" }, "first-master-secret");
    expect(() => decryptCCAvenueCredentials(payload, "second-master-secret")).toThrow();
  });
});
