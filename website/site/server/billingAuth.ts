import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

export const BILLING_SESSION_COOKIE = "ih_billing_session";
const BILLING_SESSION_TTL_SECONDS = 12 * 60 * 60;
const issuer = "ayqaealhayaa-billing";
const audience = "billing-admin";

const loginAttempts = new Map<string, { attempts: number; resetAt: number }>();

function signingKey() {
  if (!ENV.cookieSecret) throw new Error("Missing session signing secret");
  return new TextEncoder().encode(ENV.cookieSecret);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie ?? "";
  return cookieHeader
    .split(";")
    .map(item => item.trim())
    .find(item => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function isBillingAdminConfigured() {
  return Boolean(ENV.billingAdminEmail && ENV.billingAdminPassword);
}

export function isValidBillingAdminCredentials(email: string, password: string) {
  if (!isBillingAdminConfigured()) return false;
  return safeEqual(email.trim().toLowerCase(), ENV.billingAdminEmail) && safeEqual(password, ENV.billingAdminPassword);
}

export function isBillingLoginRateLimited(identifier: string) {
  const record = loginAttempts.get(identifier);
  if (!record) return false;
  if (record.resetAt <= Date.now()) {
    loginAttempts.delete(identifier);
    return false;
  }
  return record.attempts >= 5;
}

export function recordFailedBillingLogin(identifier: string) {
  const current = loginAttempts.get(identifier);
  const resetAt = current?.resetAt && current.resetAt > Date.now() ? current.resetAt : Date.now() + 15 * 60 * 1000;
  loginAttempts.set(identifier, { attempts: (current?.attempts ?? 0) + 1, resetAt });
}

export function clearBillingLoginAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

export async function createBillingSession(email: string) {
  return new SignJWT({ scope: "billing_admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(email.trim().toLowerCase())
    .setIssuedAt()
    .setExpirationTime(`${BILLING_SESSION_TTL_SECONDS}s`)
    .sign(signingKey());
}

export async function getBillingAdminSession(request: Request) {
  const token = getCookie(request, BILLING_SESSION_COOKIE);
  if (!token || !isBillingAdminConfigured()) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { issuer, audience });
    const email = typeof payload.sub === "string" ? payload.sub : "";
    const scope = payload.scope;
    if (scope !== "billing_admin" || !safeEqual(email, ENV.billingAdminEmail)) return null;
    return { email };
  } catch {
    return null;
  }
}

export function setBillingSessionCookie(response: Response, token: string) {
  response.cookie(BILLING_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: ENV.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: BILLING_SESSION_TTL_SECONDS * 1000,
  });
}

export function clearBillingSessionCookie(response: Response) {
  response.clearCookie(BILLING_SESSION_COOKIE, {
    httpOnly: true,
    secure: ENV.isProduction,
    sameSite: "lax",
    path: "/",
  });
}
