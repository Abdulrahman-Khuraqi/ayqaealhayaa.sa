import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { paymentGatewaySettings } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

const PROVIDER = "ccavenue";
const PAYLOAD_VERSION = "v1";

export type CCAvenueCredentials = {
  merchantId: string;
  accessCode: string;
  encryptionKey: string;
};

type StoredCCAvenueSettings = CCAvenueCredentials & { liveEnabled: boolean };

function encryptionKey(secret: string) {
  return createHash("sha256").update(`${secret}:ccavenue-gateway-settings:v1`, "utf8").digest();
}

export function encryptCCAvenueCredentials(credentials: CCAvenueCredentials, secret = ENV.cookieSecret) {
  if (!secret) throw new Error("تعذر تجهيز حماية إعدادات CCAvenue");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), nonce);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(credentials), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PAYLOAD_VERSION, nonce.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptCCAvenueCredentials(payload: string, secret = ENV.cookieSecret): CCAvenueCredentials {
  if (!secret) throw new Error("تعذر تجهيز حماية إعدادات CCAvenue");
  const [version, nonceValue, tagValue, encryptedValue] = payload.split(".");
  if (version !== PAYLOAD_VERSION || !nonceValue || !tagValue || !encryptedValue) throw new Error("إعدادات CCAvenue المشفرة غير صالحة");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(nonceValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const result = Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]);
  const data = JSON.parse(result.toString("utf8")) as Partial<CCAvenueCredentials>;
  if (!data.merchantId || !data.accessCode || !data.encryptionKey) throw new Error("بيانات CCAvenue المشفرة غير مكتملة");
  return { merchantId: data.merchantId, accessCode: data.accessCode, encryptionKey: data.encryptionKey };
}

export async function getStoredCCAvenueSettings(): Promise<StoredCCAvenueSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const [stored] = await db.select().from(paymentGatewaySettings).where(eq(paymentGatewaySettings.provider, PROVIDER)).limit(1);
  if (!stored) return null;
  const credentials = decryptCCAvenueCredentials(stored.encryptedPayload);
  return { ...credentials, liveEnabled: stored.liveEnabled };
}

export async function getCCAvenueAdminStatus() {
  const db = await getDb();
  if (!db) return { configured: false, liveEnabled: false, storageReady: false };
  const [stored] = await db.select().from(paymentGatewaySettings).where(eq(paymentGatewaySettings.provider, PROVIDER)).limit(1);
  if (!stored) return { configured: false, liveEnabled: false, storageReady: true };
  try {
    const credentials = decryptCCAvenueCredentials(stored.encryptedPayload);
    return { configured: Boolean(credentials.merchantId && credentials.accessCode && credentials.encryptionKey), liveEnabled: stored.liveEnabled, storageReady: true };
  } catch {
    return { configured: false, liveEnabled: false, storageReady: true };
  }
}

export async function saveCCAvenueCredentials(credentials: CCAvenueCredentials, updatedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة بيانات الإعدادات غير متاحة");
  const encryptedPayload = encryptCCAvenueCredentials(credentials);
  await db.insert(paymentGatewaySettings).values({ provider: PROVIDER, encryptedPayload, liveEnabled: false, updatedBy }).onDuplicateKeyUpdate({
    set: { encryptedPayload, liveEnabled: false, updatedBy },
  });
  return { configured: true, liveEnabled: false, storageReady: true };
}

export async function setCCAvenueLiveEnabled(liveEnabled: boolean, updatedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة بيانات الإعدادات غير متاحة");
  const [stored] = await db.select().from(paymentGatewaySettings).where(eq(paymentGatewaySettings.provider, PROVIDER)).limit(1);
  if (!stored) throw new Error("أدخل بيانات CCAvenue أولًا");
  decryptCCAvenueCredentials(stored.encryptedPayload);
  await db.update(paymentGatewaySettings).set({ liveEnabled, updatedBy }).where(eq(paymentGatewaySettings.provider, PROVIDER));
  return { configured: true, liveEnabled, storageReady: true };
}
