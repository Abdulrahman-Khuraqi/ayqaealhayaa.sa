import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("admin access", () => {
  it("rejects an external admin session that does not include the independent billing-admin session", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 99,
        openId: "external-admin",
        name: "External Admin",
        email: "external@example.com",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      billingAdminEmail: null,
      req: { headers: {}, protocol: "https" } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    await expect(appRouter.createCaller(ctx).store.catalog.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
