import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { paymentGatewaySettings } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

const PROVIDER = "neoleap";
const PAYLOAD_VERSION = "v1";

export type NeoleapCredentials = {
  gatewayId: string;
  gatewayPassword: string;
  deviceResourceKey: string;
};

type StoredNeoleapSettings = NeoleapCredentials & { liveEnabled: boolean };

function encryptionKey(secret: string) {
  return createHash("sha256").update(`${secret}:neoleap-gateway-settings:v1`, "utf8").digest();
}

export function encryptNeoleapCredentials(credentials: NeoleapCredentials, secret = ENV.cookieSecret) {
  if (!secret) throw new Error("تعذر تجهيز حماية إعدادات Neoleap");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), nonce);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(credentials), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PAYLOAD_VERSION, nonce.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptNeoleapCredentials(payload: string, secret = ENV.cookieSecret): NeoleapCredentials {
  if (!secret) throw new Error("تعذر تجهيز حماية إعدادات Neoleap");
  const [version, nonceValue, tagValue, encryptedValue] = payload.split(".");
  if (version !== PAYLOAD_VERSION || !nonceValue || !tagValue || !encryptedValue) throw new Error("إعدادات Neoleap المشفرة غير صالحة");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(nonceValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const result = Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]);
  const data = JSON.parse(result.toString("utf8")) as Partial<NeoleapCredentials>;
  if (!data.gatewayId || !data.gatewayPassword || !data.deviceResourceKey) throw new Error("بيانات Neoleap المشفرة غير مكتملة");
  return { gatewayId: data.gatewayId, gatewayPassword: data.gatewayPassword, deviceResourceKey: data.deviceResourceKey };
}

export async function getStoredNeoleapSettings(): Promise<StoredNeoleapSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const [stored] = await db.select().from(paymentGatewaySettings).where(eq(paymentGatewaySettings.provider, PROVIDER)).limit(1);
  if (!stored) return null;
  const credentials = decryptNeoleapCredentials(stored.encryptedPayload);
  return { ...credentials, liveEnabled: stored.liveEnabled };
}

export async function getNeoleapAdminStatus() {
  const db = await getDb();
  if (!db) return { configured: false, liveEnabled: false, storageReady: false, environment: "test" as const };
  const [stored] = await db.select().from(paymentGatewaySettings).where(eq(paymentGatewaySettings.provider, PROVIDER)).limit(1);
  if (!stored) return { configured: false, liveEnabled: false, storageReady: true, environment: "test" as const };
  try {
    const credentials = decryptNeoleapCredentials(stored.encryptedPayload);
    return { configured: Boolean(credentials.gatewayId && credentials.gatewayPassword && credentials.deviceResourceKey), liveEnabled: false, storageReady: true, environment: "test" as const };
  } catch {
    return { configured: false, liveEnabled: false, storageReady: true, environment: "test" as const };
  }
}

export async function saveNeoleapCredentials(credentials: NeoleapCredentials, updatedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة بيانات الإعدادات غير متاحة");
  const encryptedPayload = encryptNeoleapCredentials(credentials);
  await db.insert(paymentGatewaySettings).values({ provider: PROVIDER, encryptedPayload, liveEnabled: false, updatedBy }).onDuplicateKeyUpdate({
    set: { encryptedPayload, liveEnabled: false, updatedBy },
  });
  return { configured: true, liveEnabled: false, storageReady: true, environment: "test" as const };
}
