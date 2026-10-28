import { describe, expect, it } from "vitest";
import { decryptNeoleapCredentials, encryptNeoleapCredentials } from "./neoleapGatewaySettings";

describe("Neoleap gateway settings encryption", () => {
  const credentials = { gatewayId: "gateway-test", gatewayPassword: "password-test", deviceResourceKey: "resource-key-test" };
  const testSecret = "local-test-secret";

  it("round-trips credentials only with the server secret", () => {
    const payload = encryptNeoleapCredentials(credentials, testSecret);
    expect(payload).not.toContain(credentials.gatewayPassword);
    expect(decryptNeoleapCredentials(payload, testSecret)).toEqual(credentials);
  });

  it("rejects an invalid encrypted payload", () => {
    expect(() => decryptNeoleapCredentials("v1.invalid.payload", testSecret)).toThrow("إعدادات Neoleap المشفرة غير صالحة");
  });
});
