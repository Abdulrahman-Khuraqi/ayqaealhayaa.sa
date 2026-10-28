import type { Request, Response } from "express";
import { getStoredCCAvenueSettings } from "./ccavenueGatewaySettings";

type CCAvenueConfiguration = {
  merchantId: string;
  accessCode: string;
  encryptionKey: string;
  credentialsReady: boolean;
  livePaymentsEnabled: boolean;
  configured: boolean;
  missing: Array<"merchantId" | "accessCode" | "encryptionKey">;
};

export async function getCCAvenueConfiguration(): Promise<CCAvenueConfiguration> {
  const stored = await getStoredCCAvenueSettings();
  const merchantId = stored?.merchantId ?? process.env.CCAVENUE_MERCHANT_ID?.trim() ?? "";
  const accessCode = stored?.accessCode ?? process.env.CCAVENUE_ACCESS_CODE?.trim() ?? "";
  const encryptionKey = stored?.encryptionKey ?? process.env.CCAVENUE_ENCRYPTION_KEY?.trim() ?? "";
  const missing: CCAvenueConfiguration["missing"] = [];

  if (!merchantId) missing.push("merchantId");
  if (!accessCode) missing.push("accessCode");
  if (!encryptionKey) missing.push("encryptionKey");

  const credentialsReady = missing.length === 0;
  // لا يسمح بتفعيل التحصيل الحي من مفاتيح بيئة موروثة؛ يلزم إعداد مشفر محفوظ من لوحة الإدارة وتفعيل صريح لاحق.
  const livePaymentsEnabled = stored?.liveEnabled ?? false;
  return {
    merchantId,
    accessCode,
    encryptionKey,
    credentialsReady,
    livePaymentsEnabled,
    configured: credentialsReady && livePaymentsEnabled,
    missing,
  };
}

/**
 * فحص تشغيلي خفيف: يعيد حالة الإعداد فقط ولا يعيد أي قيمة سرية إلى العميل.
 */
export async function ccavenueConfigurationStatus(_request: Request, response: Response) {
  const configuration = await getCCAvenueConfiguration();
  response.status(configuration.credentialsReady ? 200 : 503).json({
    provider: "ccavenue",
    credentials_ready: configuration.credentialsReady,
    live_payments_enabled: configuration.livePaymentsEnabled,
    missing: configuration.missing,
  });
}
