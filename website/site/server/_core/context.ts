import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getBillingAdminSession } from "../billingAuth";
import { getOrCreateBillingAdminUser } from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  billingAdminEmail: string | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let billingAdminEmail: string | null = null;

  try {
    const billingSession = await getBillingAdminSession(opts.req);
    if (billingSession) {
      user = (await getOrCreateBillingAdminUser(billingSession.email)) ?? null;
      billingAdminEmail = user ? billingSession.email : null;
    } else {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    billingAdminEmail,
  };
}
