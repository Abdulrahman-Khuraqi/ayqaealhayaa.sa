import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { clearBillingLoginAttempts, clearBillingSessionCookie, createBillingSession, isBillingAdminConfigured, isBillingLoginRateLimited, isValidBillingAdminCredentials, recordFailedBillingLogin, setBillingSessionCookie } from "./billingAuth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { activateInvoicePayment, createIntegrationApiKey, createInvoice, getInvoiceByPublicId, getPublicInvoice, listIntegrationApiKeys, listInvoices, revokeIntegrationApiKey, toHalalas, updateInvoiceStatus } from "./invoiceService";
import { getCCAvenueConfiguration } from "./ccavenueConfig";
import { getCCAvenueAdminStatus, saveCCAvenueCredentials, setCCAvenueLiveEnabled } from "./ccavenueGatewaySettings";
import { getNeoleapAdminStatus, saveNeoleapCredentials } from "./neoleapGatewaySettings";

const CCAVENUE_ORIGIN = "https://ayqaealhayaa.sa";
import { archiveCatalogItem, bootstrapCurrentStoreContent, createCatalogItem, createStoreOrder, listCatalogItems, listOrders, listStoreContent, serializeCatalogItem, serializeOrder, toHalalas as storeToHalalas, updateCatalogItem, updateStoreOrder, uploadCatalogImage, upsertStoreContent } from "./storeAdminService";

const catalogInput = z.object({
  kind: z.enum(["product", "service"]),
  name: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(120),
  description: z.string().trim().max(4_000).optional(),
  price: z.number().positive().max(1_000_000).nullable().optional(),
  priceLabel: z.string().trim().max(80).optional(),
  imageUrl: z.string().trim().max(1_000).optional(),
  imageKey: z.string().trim().max(320).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  billingAuth: router({
    me: publicProcedure.query(({ ctx }) => ctx.billingAdminEmail ? { email: ctx.billingAdminEmail } : null),
    login: publicProcedure
      .input(z.object({ email: z.string().email().max(320), password: z.string().min(1).max(256) }))
      .mutation(async ({ input, ctx }) => {
        if (!isBillingAdminConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لوحة الفواتير غير مهيأة بعد" });
        }
        const identifier = `${ctx.req.ip}:${input.email.trim().toLowerCase()}`;
        if (isBillingLoginRateLimited(identifier)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "تجاوزت عدد المحاولات. حاول بعد 15 دقيقة." });
        }
        if (!isValidBillingAdminCredentials(input.email, input.password)) {
          recordFailedBillingLogin(identifier);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }
        clearBillingLoginAttempts(identifier);
        const token = await createBillingSession(input.email);
        setBillingSessionCookie(ctx.res, token);
        return { success: true, email: input.email.trim().toLowerCase() };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearBillingSessionCookie(ctx.res);
      return { success: true } as const;
    }),
  }),
  ccavenueAdmin: router({
    status: adminProcedure.query(() => getCCAvenueAdminStatus()),
    saveCredentials: adminProcedure
      .input(z.object({ merchantId: z.string().trim().min(3).max(80), accessCode: z.string().trim().min(6).max(160), encryptionKey: z.string().trim().min(8).max(256) }))
      .mutation(({ input, ctx }) => saveCCAvenueCredentials(input, ctx.user.id)),
    setLiveEnabled: adminProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(({ input, ctx }) => setCCAvenueLiveEnabled(input.enabled, ctx.user.id)),
  }),
  neoleapAdmin: router({
    status: adminProcedure.query(() => getNeoleapAdminStatus()),
    saveCredentials: adminProcedure
      .input(z.object({ gatewayId: z.string().trim().min(3).max(160), gatewayPassword: z.string().trim().min(8).max(512), deviceResourceKey: z.string().trim().min(8).max(512) }))
      .mutation(({ input, ctx }) => saveNeoleapCredentials(input, ctx.user.id)),
  }),
  invoices: router({
    list: adminProcedure.query(() => listInvoices()),
    create: adminProcedure
      .input(z.object({
        customerName: z.string().trim().min(2).max(160),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().trim().min(7).max(32).optional(),
        description: z.string().trim().min(3).max(2_000),
        amount: z.number().positive().max(1_000_000),
        expiresInDays: z.number().int().min(1).max(90).default(7),
      }))
      .mutation(async ({ input, ctx }) => {
        const invoice = await createInvoice({
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          description: input.description,
          amountHalalas: toHalalas(input.amount),
          expiresInDays: input.expiresInDays,
          metadata: { source: "store_admin" },
        }, ctx.user.id);
        if (!invoice || !(await getCCAvenueConfiguration()).configured) return invoice;
        return activateInvoicePayment({
          invoiceId: invoice.id,
          providerName: "ccavenue",
          providerInvoiceId: invoice.reference,
          providerPaymentUrl: `${CCAVENUE_ORIGIN}/api/payment-links/v1/ccavenue/checkout/${invoice.publicId}`,
          changedBy: ctx.user.id,
        });
      }),
    getPublic: publicProcedure
      .input(z.object({ publicId: z.string().trim().min(12).max(48) }))
      .query(({ input }) => getPublicInvoice(input.publicId)),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["pending", "paid", "cancelled"]) }))
      .mutation(({ input, ctx }) => updateInvoiceStatus({
        invoiceId: input.id,
        nextStatus: input.status,
        changedBy: ctx.user.id,
      })),
    activateCCAvenue: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const invoices = await listInvoices(200);
        const invoice = invoices.find(item => item.id === input.id);
        if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "الفاتورة غير موجودة" });
        const configuration = await getCCAvenueConfiguration();
        if (!configuration.configured) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "CCAvenue غير مفعّل حيًا بعد" });
        return activateInvoicePayment({
          invoiceId: invoice.id,
          providerName: "ccavenue",
          providerInvoiceId: invoice.reference,
          providerPaymentUrl: `${CCAVENUE_ORIGIN}/api/payment-links/v1/ccavenue/checkout/${invoice.publicId}`,
          changedBy: ctx.user.id,
        });
      }),
  }),
  apiKeys: router({
    list: adminProcedure.query(() => listIntegrationApiKeys()),
    create: adminProcedure
      .input(z.object({ name: z.string().trim().min(2).max(120) }))
      .mutation(({ input, ctx }) => createIntegrationApiKey(input.name, ctx.user.id)),
    revoke: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await revokeIntegrationApiKey(input.id);
        return { success: true };
      }),
  }),
  store: router({
    publicCatalog: publicProcedure.query(async () => (await listCatalogItems()).map(serializeCatalogItem)),
    publicContent: publicProcedure.query(() => listStoreContent()),
    submitRequest: publicProcedure
      .input(z.object({
        customerName: z.string().trim().min(2).max(160),
        customerPhone: z.string().trim().min(7).max(32),
        customerEmail: z.string().email().optional(),
        summary: z.string().trim().min(3).max(4_000),
      }))
      .mutation(async ({ input }) => {
        const order = await createStoreOrder({ ...input, createdBy: 0 });
        return order ? serializeOrder(order) : null;
      }),
    bootstrapCurrent: adminProcedure.mutation(({ ctx }) => bootstrapCurrentStoreContent(ctx.user.id)),
    catalog: router({
      list: adminProcedure.query(async () => (await listCatalogItems(true)).map(serializeCatalogItem)),
      create: adminProcedure.input(catalogInput).mutation(({ input, ctx }) => createCatalogItem({ ...input, priceHalalas: storeToHalalas(input.price), priceLabel: input.priceLabel }, ctx.user.id)),
      update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: catalogInput })).mutation(({ input }) => updateCatalogItem(input.id, { ...input.data, priceHalalas: storeToHalalas(input.data.price), priceLabel: input.data.priceLabel })),
      archive: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => archiveCatalogItem(input.id)),
      uploadImage: adminProcedure.input(z.object({ dataUrl: z.string().max(6_000_000) })).mutation(({ input, ctx }) => uploadCatalogImage(input.dataUrl, ctx.user.id)),
    }),
    orders: router({
      list: adminProcedure.query(async () => (await listOrders()).map(serializeOrder)),
      create: adminProcedure.input(z.object({ customerName: z.string().trim().min(2).max(160), customerPhone: z.string().trim().min(7).max(32).optional(), customerEmail: z.string().email().optional(), summary: z.string().trim().min(3).max(4_000), notes: z.string().trim().max(4_000).optional(), amount: z.number().positive().max(1_000_000).nullable().optional() })).mutation(async ({ input, ctx }) => {
        const order = await createStoreOrder({ ...input, amountHalalas: storeToHalalas(input.amount), createdBy: ctx.user.id });
        return order ? serializeOrder(order) : null;
      }),
      update: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "contacted", "quoted", "in_progress", "completed", "cancelled"]), notes: z.string().trim().max(4_000).optional(), amount: z.number().positive().max(1_000_000).nullable().optional(), invoiceId: z.number().int().positive().nullable().optional() })).mutation(({ input }) => updateStoreOrder(input.id, { status: input.status, notes: input.notes, amountHalalas: storeToHalalas(input.amount), invoiceId: input.invoiceId })),
    }),
    content: router({
      list: adminProcedure.query(() => listStoreContent()),
      update: adminProcedure.input(z.record(z.string().max(120), z.string().max(8_000))).mutation(({ input, ctx }) => upsertStoreContent(input, ctx.user.id)),
    }),
  }),
});

export type AppRouter = typeof appRouter;
