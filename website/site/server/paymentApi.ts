import type { Express, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { activateInvoicePayment, applyProviderPaymentResult, createInvoice, getInvoiceByPublicId, getInvoiceByReference, recordPaymentEvent, toHalalas, validateIntegrationApiKey } from "./invoiceService";
import { getPaymentProvider } from "./paymentProvider";
import { ccavenueConfigurationStatus, getCCAvenueConfiguration } from "./ccavenueConfig";
import { buildCCAvenueCheckoutHtml, buildCCAvenueEncryptedRequest, decryptCCAvenueResponse, parseCCAvenueResponse, validateCCAvenueResponse } from "./ccavenueProvider";

const CCAVENUE_ORIGIN = "https://ayqaealhayaa.sa";

const externalInvoiceInput = z.object({
  customer_name: z.string().trim().min(2).max(160),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().trim().min(7).max(32).optional(),
  description: z.string().trim().min(3).max(2_000),
  amount: z.number().positive().max(1_000_000),
  expires_in_days: z.number().int().min(1).max(90).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function getApiKey(request: Request) {
  const authorization = request.header("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return request.header("x-api-key")?.trim() ?? "";
}

async function authenticate(request: Request, response: Response) {
  const rawKey = getApiKey(request);
  if (!rawKey) {
    response.status(401).json({ error: "missing_api_key" });
    return null;
  }
  const key = await validateIntegrationApiKey(rawKey);
  if (!key) {
    response.status(401).json({ error: "invalid_api_key" });
    return null;
  }
  return key;
}

function publicOrigin(request: Request) {
  const forwardedProtocol = request.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || request.protocol || "https";
  return `${protocol}://${request.get("host")}`;
}

export function registerPaymentApiRoutes(app: Express) {
  const router = Router();

  router.get("/providers/ccavenue/status", ccavenueConfigurationStatus);

  router.post("/invoices", async (request, response) => {
    try {
      const key = await authenticate(request, response);
      if (!key) return;
      const input = externalInvoiceInput.parse(request.body);
      const invoice = await createInvoice(
        {
          customerName: input.customer_name,
          customerEmail: input.customer_email,
          customerPhone: input.customer_phone,
          description: input.description,
          amountHalalas: toHalalas(input.amount),
          expiresInDays: input.expires_in_days,
          metadata: { source: "external_api", integrationKeyId: key.id, ...input.metadata },
        },
        key.createdBy,
      );
      if (!invoice) throw new Error("Invoice creation did not return an invoice");
      const activeInvoice = (await getCCAvenueConfiguration()).configured
        ? await activateInvoicePayment({
            invoiceId: invoice.id,
            providerName: "ccavenue",
            providerInvoiceId: invoice.reference,
            providerPaymentUrl: `${CCAVENUE_ORIGIN}/api/payment-links/v1/ccavenue/checkout/${invoice.publicId}`,
            changedBy: key.createdBy,
          })
        : invoice;
      const paymentUrl = `${publicOrigin(request)}/pay/${invoice.publicId}`;
      response.status(201).json({
        id: activeInvoice?.reference ?? invoice.reference,
        status: activeInvoice?.status ?? invoice.status,
        amount: invoice.amountHalalas / 100,
        currency: invoice.currency,
        payment_url: paymentUrl,
        payment_ready: Boolean(activeInvoice?.providerPaymentUrl),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({ error: "invalid_request", details: error.flatten() });
        return;
      }
      console.error("[payment-api] failed to create invoice", error);
      response.status(500).json({ error: "invoice_creation_failed" });
    }
  });

  router.get("/invoices/:reference", async (request, response) => {
    try {
      const key = await authenticate(request, response);
      if (!key) return;
      const invoice = await getInvoiceByReference(request.params.reference);
      if (!invoice) {
        response.status(404).json({ error: "invoice_not_found" });
        return;
      }
      response.json({
        id: invoice.reference,
        status: invoice.status,
        amount: invoice.amountHalalas / 100,
        currency: invoice.currency,
        provider: invoice.providerName,
        payment_ready: Boolean(invoice.providerPaymentUrl),
        paid_at: invoice.paidAt,
        expires_at: invoice.expiresAt,
      });
    } catch (error) {
      console.error("[payment-api] failed to retrieve invoice", error);
      response.status(500).json({ error: "invoice_lookup_failed" });
    }
  });

  router.get("/ccavenue/checkout/:publicId", async (request, response) => {
    try {
      const invoice = await getInvoiceByPublicId(request.params.publicId);
      if (!invoice || !["pending", "failed"].includes(invoice.status) || invoice.providerName !== "ccavenue") {
        response.status(404).send("رابط الدفع غير متاح");
        return;
      }
      if (invoice.expiresAt && invoice.expiresAt.getTime() < Date.now()) {
        response.status(410).send("انتهت صلاحية رابط الدفع");
        return;
      }
      const requestData = await buildCCAvenueEncryptedRequest({
        reference: invoice.reference,
        publicId: invoice.publicId,
        amountHalalas: invoice.amountHalalas,
        currency: invoice.currency,
        description: invoice.description,
        customer: { name: invoice.customerName, email: invoice.customerEmail, phone: invoice.customerPhone },
      }, CCAVENUE_ORIGIN);
      response.type("html").send(buildCCAvenueCheckoutHtml(requestData));
    } catch (error) {
      console.error("[ccavenue] unable to prepare hosted checkout", error);
      response.status(503).send("تعذر تجهيز صفحة الدفع. يرجى المحاولة لاحقًا.");
    }
  });

  router.all("/ccavenue/return", async (request, response) => {
    const encryptedResponse = String(request.body?.encResp ?? request.query.encResp ?? "");
    if (!encryptedResponse) {
      response.status(400).send("استجابة الدفع غير مكتملة");
      return;
    }
    try {
      const configuration = await getCCAvenueConfiguration();
      const providerResponse = parseCCAvenueResponse(decryptCCAvenueResponse(encryptedResponse, configuration.encryptionKey));
      const publicId = providerResponse.merchant_param1;
      const invoice = publicId ? await getInvoiceByPublicId(publicId) : null;
      if (!invoice || !validateCCAvenueResponse(providerResponse, invoice)) {
        response.status(400).send("تعذر التحقق من نتيجة الدفع");
        return;
      }
      const providerStatus = providerResponse.order_status?.toLowerCase();
      const nextStatus = providerStatus === "success" ? "paid" : providerStatus === "failure" ? "failed" : "pending";
      await applyProviderPaymentResult({
        publicId: invoice.publicId,
        providerName: "ccavenue",
        providerInvoiceId: providerResponse.tracking_id,
        nextStatus,
        payload: {
          orderStatus: providerResponse.order_status,
          trackingId: providerResponse.tracking_id,
          bankReference: providerResponse.bank_ref_no,
          statusCode: providerResponse.status_code,
          statusMessage: providerResponse.status_message,
        },
      });
      response.redirect(`/pay/${invoice.publicId}`);
    } catch (error) {
      console.error("[ccavenue] payment return verification failed", error);
      response.status(400).send("تعذر التحقق من نتيجة الدفع");
    }
  });

  router.post("/ccavenue/events/order-status", async (request, response) => {
    const reference = typeof request.body?.order_id === "string" ? request.body.order_id.trim() : "";
    if (!reference) {
      response.status(400).json({ error: "missing_order_reference" });
      return;
    }
    try {
      const invoice = await getInvoiceByReference(reference);
      if (!invoice || invoice.providerName !== "ccavenue") {
        response.status(404).json({ error: "invoice_not_found" });
        return;
      }
      await recordPaymentEvent({
        invoiceId: invoice.id,
        eventType: "ccavenue.order_status_notification",
        source: "ccavenue_dynamic_notification",
        signatureVerified: false,
        payload: {
          orderStatus: typeof request.body.order_status === "string" ? request.body.order_status : undefined,
          trackingId: typeof request.body.tracking_id === "string" ? request.body.tracking_id : undefined,
          statusCode: typeof request.body.status_code === "string" ? request.body.status_code : undefined,
        },
      });
      // لا يعتمد هذا الحدث وحده لتحديث حالة الفاتورة لأنه لا يحمل برهانًا مشفرًا للتحقق من المصدر.
      response.status(202).json({ accepted: true, verified: false });
    } catch (error) {
      console.error("[ccavenue] order status event recording failed", error);
      response.status(500).json({ error: "notification_recording_failed" });
    }
  });

  router.post("/callbacks/:provider", async (request, response) => {
    try {
      const activeProvider = getPaymentProvider();
      if (activeProvider.name === "unconfigured" || activeProvider.name !== request.params.provider) {
        response.status(503).json({ error: "payment_provider_not_configured" });
        return;
      }
      const result = await activeProvider.verifyWebhook(request.body, request.header("x-signature") ?? undefined);
      if (!result.verified) {
        response.status(401).json({ error: "invalid_callback_signature" });
        return;
      }
      response.status(202).json({ accepted: true, event_type: result.eventType ?? "payment.updated" });
    } catch (error) {
      console.error("[payment-api] callback verification failed", error);
      response.status(400).json({ error: "callback_rejected" });
    }
  });

  app.use("/api/payment-links/v1", router);
}
