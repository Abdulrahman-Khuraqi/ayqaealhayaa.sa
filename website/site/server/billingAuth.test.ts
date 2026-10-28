import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { BILLING_SESSION_COOKIE, isBillingAdminConfigured } from "./billingAuth";
import type { TrpcContext } from "./_core/context";

function createBillingContext(): { ctx: TrpcContext; cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> } {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    ctx: {
      user: null,
      billingAdminEmail: null,
      req: { ip: "127.0.0.1", headers: {}, protocol: "https" } as TrpcContext["req"],
      res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) } as TrpcContext["res"],
    },
    cookies,
  };
}

describe("billingAuth.login", () => {
  it("accepts the configured secret through the login endpoint and creates an HttpOnly session", async () => {
    expect(isBillingAdminConfigured()).toBe(true);
    const email = process.env.BILLING_ADMIN_EMAIL ?? "";
    const password = process.env.BILLING_ADMIN_PASSWORD ?? "";
    const { ctx, cookies } = createBillingContext();
    const result = await appRouter.createCaller(ctx).billingAuth.login({ email, password });
    expect(result.success).toBe(true);
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(BILLING_SESSION_COOKIE);
    expect(cookies[0]?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(cookies[0]?.value).not.toBe(password);
  });

  it("rejects an incorrect password without issuing a billing session", async () => {
    const email = process.env.BILLING_ADMIN_EMAIL ?? "";
    const { ctx, cookies } = createBillingContext();
    await expect(
      appRouter.createCaller(ctx).billingAuth.login({ email, password: "incorrect-password" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookies).toHaveLength(0);
  });
});
