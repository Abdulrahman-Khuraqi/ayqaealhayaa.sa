/**
 * عقد موحّد لشركات تشغيل الدفع. لا تضع مفاتيح الشركة في الواجهة ولا تقبل
 * إشعار السداد إلا عبر محول يثبت توقيعه على الخادم.
 */
export type ProviderInvoiceRequest = {
  reference: string;
  amountHalalas: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  callbackUrl: string;
  customer: { name: string; email?: string | null; phone?: string | null };
};

export type ProviderInvoiceResult = {
  providerName: string | null;
  providerInvoiceId: string | null;
  paymentUrl: string | null;
  activationState: "ready" | "unconfigured";
};

export type ProviderWebhookResult = {
  verified: boolean;
  providerInvoiceId?: string;
  eventType?: string;
  paymentStatus?: "paid" | "failed" | "pending";
  rawPayload?: unknown;
};

export interface PaymentProviderAdapter {
  readonly name: string;
  createHostedInvoice(input: ProviderInvoiceRequest): Promise<ProviderInvoiceResult>;
  verifyWebhook(payload: unknown, signature: string | undefined): Promise<ProviderWebhookResult>;
}

/**
 * الحالة الافتراضية الآمنة: تستمر منصة الفواتير في العمل، لكن لا تُحوّل العميل
 * إلى دفع ولا تقبل أي إشعار حتى تحديد شركة التشغيل وتركيب محولها الموثوق.
 */
export class UnconfiguredPaymentProvider implements PaymentProviderAdapter {
  readonly name = "unconfigured";

  async createHostedInvoice(): Promise<ProviderInvoiceResult> {
    return {
      providerName: null,
      providerInvoiceId: null,
      paymentUrl: null,
      activationState: "unconfigured",
    };
  }

  async verifyWebhook(payload: unknown): Promise<ProviderWebhookResult> {
    return { verified: false, rawPayload: payload };
  }
}

let activeProvider: PaymentProviderAdapter = new UnconfiguredPaymentProvider();

export function getPaymentProvider() {
  return activeProvider;
}

/** لا يُستدعى هذا إلا أثناء تهيئة محول شركة تشغيل مراجَع ومزود بأسرار خادم. */
export function registerPaymentProvider(provider: PaymentProviderAdapter) {
  activeProvider = provider;
}
