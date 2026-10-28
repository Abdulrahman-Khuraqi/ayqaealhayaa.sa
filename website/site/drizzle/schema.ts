import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const invoiceStatus = ["draft", "pending", "paid", "expired", "cancelled", "failed"] as const;

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 48 }).notNull().unique(),
  reference: varchar("reference", { length: 64 }).notNull().unique(),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  description: text("description").notNull(),
  amountHalalas: int("amountHalalas").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("SAR"),
  status: mysqlEnum("status", invoiceStatus).notNull().default("draft"),
  providerName: varchar("providerName", { length: 80 }),
  providerInvoiceId: varchar("providerInvoiceId", { length: 160 }),
  providerPaymentUrl: text("providerPaymentUrl"),
  expiresAt: timestamp("expiresAt"),
  paidAt: timestamp("paidAt"),
  metadata: text("metadata"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const integrationApiKeys = mysqlTable("integration_api_keys", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  keyPrefix: varchar("keyPrefix", { length: 24 }).notNull().unique(),
  keyHash: varchar("keyHash", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "revoked"]).notNull().default("active"),
  lastUsedAt: timestamp("lastUsedAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const paymentEvents = mysqlTable("payment_events", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  source: varchar("source", { length: 80 }).notNull(),
  signatureVerified: boolean("signatureVerified").notNull().default(false),
  payload: text("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const catalogItemKind = ["product", "service"] as const;
export const orderStatus = ["new", "contacted", "quoted", "in_progress", "completed", "cancelled"] as const;

export const catalogItems = mysqlTable("catalog_items", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", catalogItemKind).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  description: text("description"),
  priceHalalas: int("priceHalalas"),
  priceLabel: varchar("priceLabel", { length: 80 }),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 320 }),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const storeOrders = mysqlTable("store_orders", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 64 }).notNull().unique(),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 32 }),
  summary: text("summary").notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", orderStatus).notNull().default("new"),
  amountHalalas: int("amountHalalas"),
  invoiceId: int("invoiceId"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const storeContent = mysqlTable("store_content", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: text("value").notNull(),
  updatedBy: int("updatedBy").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * بيانات بوابة الدفع تحفظ مشفرة خادميًا ولا تُعاد إلى واجهة العميل بعد إدخالها.
 * يبقى وضع التفعيل منفصلًا حتى لا تؤدي إضافة بيانات التاجر إلى إتاحة التحصيل تلقائيًا.
 */
export const paymentGatewaySettings = mysqlTable("payment_gateway_settings", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 80 }).notNull().unique(),
  encryptedPayload: text("encryptedPayload").notNull(),
  liveEnabled: boolean("liveEnabled").notNull().default(false),
  updatedBy: int("updatedBy").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type IntegrationApiKey = typeof integrationApiKeys.$inferSelect;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type StoreOrder = typeof storeOrders.$inferSelect;
export type PaymentGatewaySettings = typeof paymentGatewaySettings.$inferSelect;
