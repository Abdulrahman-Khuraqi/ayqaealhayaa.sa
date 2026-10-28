import { and, desc, eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { integrationApiKeys, invoices, paymentEvents } from "../drizzle/schema";
import { getDb } from "./db";

export type CreateInvoiceInput = {
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  description: string;
  amountHalalas: number;
  expiresInDays?: number | null;
  metadata?: Record<string, unknown>;
};

const normalizeOptional = (value?: string | null) => value?.trim() || null;

export function toHalalas(amountSar: number) {
  if (!Number.isFinite(amountSar) || amountSar <= 0) {
    throw new Error("Invoice amount must be greater than zero");
  }
  return Math.round(amountSar * 100);
}

export function buildInvoiceReference(now = new Date()) {
  const date = [now.getUTCFullYear(), String(now.getUTCMonth() + 1).padStart(2, "0"), String(now.getUTCDate()).padStart(2, "0")].join("");
  return `IH-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function createPublicInvoiceId() {
  return `inv_${randomBytes(18).toString("base64url")}`;
}

export function createRawIntegrationKey() {
  return `ih_live_${randomBytes(30).toString("base64url")}`;
}

export function hashIntegrationKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

const manualStatusTransitions: Record<string, readonly string[]> = {
  draft: ["pending", "cancelled"],
  pending: ["paid", "cancelled"],
  paid: [],
  expired: [],
  cancelled: [],
  failed: ["pending", "cancelled"],
};

export function canManuallySetInvoiceStatus(currentStatus: string, nextStatus: string) {
  return manualStatusTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

export function canActivateInvoiceForProvider(status: string) {
  return ["draft", "failed"].includes(status);
}

export async function createInvoice(input: CreateInvoiceInput, createdBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const publicId = createPublicInvoiceId();
  const reference = buildInvoiceReference();
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  await db.insert(invoices).values({
    publicId,
    reference,
    customerName: input.customerName.trim(),
    customerEmail: normalizeOptional(input.customerEmail),
    customerPhone: normalizeOptional(input.customerPhone),
    description: input.description.trim(),
    amountHalalas: input.amountHalalas,
    expiresAt,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    createdBy,
  });

  return getInvoiceByPublicId(publicId);
}

export async function activateInvoicePayment(input: {
  invoiceId: number;
  providerName: string;
  providerInvoiceId: string;
  providerPaymentUrl: string;
  changedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.select().from(invoices).where(eq(invoices.id, input.invoiceId)).limit(1);
  const invoice = result[0];
  if (!invoice) throw new Error("Invoice not found");
  if (!canActivateInvoiceForProvider(invoice.status)) throw new Error("Invoice cannot be activated for payment");

  if (invoice.providerPaymentUrl && invoice.providerName === input.providerName) return invoice;

  await db.update(invoices).set({
    status: "pending",
    providerName: input.providerName,
    providerInvoiceId: input.providerInvoiceId,
    providerPaymentUrl: input.providerPaymentUrl,
  }).where(eq(invoices.id, input.invoiceId));
  await recordPaymentEvent({
    invoiceId: invoice.id,
    eventType: "invoice.payment_activated",
    source: input.providerName,
    signatureVerified: true,
    payload: { changedBy: input.changedBy },
  });
  return getInvoiceByPublicId(invoice.publicId);
}

export async function applyProviderPaymentResult(input: {
  publicId: string;
  providerName: string;
  providerInvoiceId?: string;
  nextStatus: "paid" | "failed" | "pending";
  payload: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.select().from(invoices).where(eq(invoices.publicId, input.publicId)).limit(1);
  const invoice = result[0];
  if (!invoice) throw new Error("Invoice not found");

  const canUpdate = invoice.status === "pending" || (invoice.status === "paid" && input.nextStatus === "paid");
  if (!canUpdate) throw new Error("Invoice status cannot be updated from payment response");

  await db.update(invoices).set({
    status: input.nextStatus,
    providerName: input.providerName,
    providerInvoiceId: input.providerInvoiceId ?? invoice.providerInvoiceId,
    paidAt: input.nextStatus === "paid" ? (invoice.paidAt ?? new Date()) : invoice.paidAt,
  }).where(eq(invoices.id, invoice.id));
  await recordPaymentEvent({
    invoiceId: invoice.id,
    eventType: `ccavenue.${input.nextStatus}`,
    source: input.providerName,
    signatureVerified: true,
    payload: input.payload,
  });
  return getInvoiceByPublicId(invoice.publicId);
}

export async function getInvoiceByPublicId(publicId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.select().from(invoices).where(eq(invoices.publicId, publicId)).limit(1);
  return result[0] ?? null;
}

export async function getInvoiceByReference(reference: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.select().from(invoices).where(eq(invoices.reference, reference)).limit(1);
  return result[0] ?? null;
}

export async function listInvoices(limit = 80) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(limit);
}

export async function updateInvoiceStatus(input: {
  invoiceId: number;
  nextStatus: "pending" | "paid" | "cancelled";
  changedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.select().from(invoices).where(eq(invoices.id, input.invoiceId)).limit(1);
  const invoice = result[0];
  if (!invoice) throw new Error("Invoice not found");
  if (!canManuallySetInvoiceStatus(invoice.status, input.nextStatus)) {
    throw new Error("Invoice status transition is not allowed");
  }

  const paidAt = input.nextStatus === "paid" ? new Date() : invoice.paidAt;
  await db.update(invoices).set({ status: input.nextStatus, paidAt }).where(eq(invoices.id, invoice.id));
  await recordPaymentEvent({
    invoiceId: invoice.id,
    eventType: `invoice.${input.nextStatus}`,
    source: "store_admin",
    signatureVerified: false,
    payload: { previousStatus: invoice.status, changedBy: input.changedBy },
  });
  return getInvoiceByPublicId(invoice.publicId);
}

export async function getPublicInvoice(publicId: string) {
  const invoice = await getInvoiceByPublicId(publicId);
  if (!invoice) return null;

  if (invoice.expiresAt && invoice.expiresAt.getTime() < Date.now() && ["draft", "pending"].includes(invoice.status)) {
    const db = await getDb();
    if (db) {
      await db.update(invoices).set({ status: "expired" }).where(eq(invoices.id, invoice.id));
    }
    invoice.status = "expired";
  }

  return {
    reference: invoice.reference,
    publicId: invoice.publicId,
    description: invoice.description,
    amountHalalas: invoice.amountHalalas,
    currency: invoice.currency,
    status: invoice.status,
    expiresAt: invoice.expiresAt,
    providerName: invoice.providerName,
    providerPaymentUrl: invoice.providerPaymentUrl,
    createdAt: invoice.createdAt,
  };
}

export async function createIntegrationApiKey(name: string, createdBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const secret = createRawIntegrationKey();
  const keyPrefix = secret.slice(0, 18);
  const keyHash = hashIntegrationKey(secret);
  const inserted = await db.insert(integrationApiKeys).values({
    name: name.trim(),
    keyPrefix,
    keyHash,
    createdBy,
  }).$returningId();

  return { id: inserted[0]?.id, name: name.trim(), keyPrefix, secret };
}

export async function listIntegrationApiKeys() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db
    .select({
      id: integrationApiKeys.id,
      name: integrationApiKeys.name,
      keyPrefix: integrationApiKeys.keyPrefix,
      status: integrationApiKeys.status,
      lastUsedAt: integrationApiKeys.lastUsedAt,
      createdAt: integrationApiKeys.createdAt,
    })
    .from(integrationApiKeys)
    .orderBy(desc(integrationApiKeys.createdAt));
}

export async function revokeIntegrationApiKey(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(integrationApiKeys).set({ status: "revoked" }).where(eq(integrationApiKeys.id, id));
}

export async function validateIntegrationApiKey(rawKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const keyHash = hashIntegrationKey(rawKey);
  const result = await db
    .select()
    .from(integrationApiKeys)
    .where(and(eq(integrationApiKeys.keyHash, keyHash), eq(integrationApiKeys.status, "active")))
    .limit(1);
  const key = result[0] ?? null;
  if (!key) return null;
  await db.update(integrationApiKeys).set({ lastUsedAt: new Date() }).where(eq(integrationApiKeys.id, key.id));
  return key;
}

export async function recordPaymentEvent(input: {
  invoiceId: number;
  eventType: string;
  source: string;
  signatureVerified?: boolean;
  payload?: unknown;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(paymentEvents).values({
    invoiceId: input.invoiceId,
    eventType: input.eventType,
    source: input.source,
    signatureVerified: input.signatureVerified ?? false,
    payload: input.payload === undefined ? null : JSON.stringify(input.payload),
  });
}
