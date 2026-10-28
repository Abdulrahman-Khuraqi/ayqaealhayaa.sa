import { describe, expect, it } from "vitest";
import { ccavenueConfigurationStatus, getCCAvenueConfiguration } from "./ccavenueConfig";

describe("CCAvenue server configuration", () => {
  it("loads the supplied server-only credentials without returning them from the status endpoint", async () => {
    const configuration = await getCCAvenueConfiguration();
    expect(configuration.credentialsReady).toBe(true);
    expect(configuration.configured).toBe(configuration.credentialsReady && configuration.livePaymentsEnabled);
    expect(configuration.missing).toEqual([]);

    const response = {
      statusCode: 0,
      payload: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.payload = payload;
        return this;
      },
    };

    await ccavenueConfigurationStatus({} as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      provider: "ccavenue",
      credentials_ready: true,
      live_payments_enabled: configuration.livePaymentsEnabled,
      missing: [],
    });
    expect(JSON.stringify(response.payload)).not.toContain(configuration.merchantId);
    expect(JSON.stringify(response.payload)).not.toContain(configuration.accessCode);
    expect(JSON.stringify(response.payload)).not.toContain(configuration.encryptionKey);
  });
});
