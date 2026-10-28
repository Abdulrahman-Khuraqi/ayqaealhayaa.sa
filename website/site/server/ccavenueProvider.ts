import { createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { getCCAvenueConfiguration } from "./ccavenueConfig";

const CCAVENUE_GATEWAY_URL = "https://secure.ccavenue.sa/transaction/transaction.do?command=initiateTransaction";
const ZERO_IV = Buffer.alloc(16, 0);

export type CCAvenueOrder = {
  reference: string;
  publicId: string;
  amountHalalas: number;
  currency: string;
  description: string;
  customer: { name: string; email?: string | null; phone?: string | null };
};

export type CCAvenueResponse = Record<string, string> & {
  order_id?: string;
  tracking_id?: string;
  order_status?: string;
  amount?: string;
  currency?: string;
  merchant_param1?: string;
  failure_message?: string;
};

function cipherKey(encryptionKey: string) {
  return createHash("md5").update(encryptionKey, "utf8").digest();
}

export function encryptCCAvenueRequest(plainText: string, encryptionKey: string) {
  const cipher = createCipheriv("aes-128-cbc", cipherKey(encryptionKey), ZERO_IV);
  return Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]).toString("hex");
}

export function decryptCCAvenueResponse(encryptedResponse: string, encryptionKey: string) {
  const decipher = createDecipheriv("aes-128-cbc", cipherKey(encryptionKey), ZERO_IV);
  return Buffer.concat([decipher.update(Buffer.from(encryptedResponse, "hex")), decipher.final()]).toString("utf8");
}

export function parseCCAvenueResponse(value: string): CCAvenueResponse {
  return Object.fromEntries(new URLSearchParams(value).entries());
}

function formatAmount(amountHalalas: number) {
  return (amountHalalas / 100).toFixed(2);
}

export async function buildCCAvenueEncryptedRequest(order: CCAvenueOrder, origin: string) {
  const configuration = await getCCAvenueConfiguration();
  if (!configuration.credentialsReady) throw new Error("CCAvenue credentials are not configured");

  const returnUrl = `${origin}/api/payment-links/v1/ccavenue/return`;
  const request = new URLSearchParams({
    merchant_id: configuration.merchantId,
    order_id: order.reference,
    currency: order.currency,
    amount: formatAmount(order.amountHalalas),
    redirect_url: returnUrl,
    cancel_url: returnUrl,
    language: "AR",
    merchant_param1: order.publicId,
    merchant_param2: "ayqae-alhayaa-store",
    billing_name: order.customer.name,
    billing_email: order.customer.email ?? "",
    billing_tel: order.customer.phone ?? "",
    merchant_param3: order.description.slice(0, 120),
  });

  return {
    accessCode: configuration.accessCode,
    encRequest: encryptCCAvenueRequest(request.toString(), configuration.encryptionKey),
    gatewayUrl: CCAVENUE_GATEWAY_URL,
  };
}

export function validateCCAvenueResponse(response: CCAvenueResponse, order: Pick<CCAvenueOrder, "reference" | "publicId" | "amountHalalas" | "currency">) {
  const amountMatches = Number(response.amount) === Number(formatAmount(order.amountHalalas));
  return response.order_id === order.reference && response.merchant_param1 === order.publicId && response.currency === order.currency && amountMatches;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function buildCCAvenueCheckoutHtml(input: Awaited<ReturnType<typeof buildCCAvenueEncryptedRequest>>) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>جارٍ الانتقال إلى الدفع الآمن</title></head><body style="font-family:system-ui;text-align:center;padding:3rem;background:#16110f;color:#f5e9dc"><p>جارٍ الانتقال إلى صفحة الدفع الآمنة…</p><form id="ccavenue-payment" method="post" action="${escapeHtml(input.gatewayUrl)}"><input type="hidden" name="encRequest" value="${escapeHtml(input.encRequest)}"><input type="hidden" name="access_code" value="${escapeHtml(input.accessCode)}"><noscript><button type="submit">المتابعة إلى الدفع</button></noscript></form><script>document.getElementById('ccavenue-payment').submit();</script></body></html>`;
}
