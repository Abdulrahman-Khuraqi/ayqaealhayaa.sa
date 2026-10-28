// Cart -> pay.ayqaealhayaa.sa handoff.
// The browser sends only item IDs and quantities; this server prices them from the catalog,
// signs the result with PAY_HANDOFF_SECRET (shared with the pay site) and returns a form
// the browser posts to the pay site. The pay site rejects anything unsigned, changed or expired.
import crypto from "node:crypto";
import type { Express } from "express";
import { z } from "zod";
import { listCatalogItems } from "./storeAdminService";

const PAY_SITE_URL = (process.env.PAY_SITE_URL || "https://pay.ayqaealhayaa.sa").replace(/\/+$/, "");
const STORE_URL = (process.env.STORE_URL || "https://ayqaealhayaa.sa").replace(/\/+$/, "");
const HANDOFF_MINUTES = 30;
const MAX_QTY = 20;

const checkoutInput = z.object({
  items: z.array(z.object({
    id: z.number().int().positive(),
    quantity: z.number().int().min(1).max(MAX_QTY),
  })).min(1).max(30),
});

export type HandoffPayload = {
  v: 1;
  ref: string;
  items: { id: number; name: string; qty: number; price: number }[]; // price in halalas
  total: number; // halalas
  currency: "SAR";
  lang: "ar";
  storeUrl: string;
  iat: number;
  exp: number;
};

export function signHandoff(payload: HandoffPayload, secret: string) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("hex");
  return { payload: encoded, signature };
}

export function registerPayHandoffRoutes(app: Express) {
  app.post("/api/checkout/pay", async (req, res) => {
    const secret = process.env.PAY_HANDOFF_SECRET || "";
    if (secret.length < 32) {
      res.status(503).json({ error: "الدفع الإلكتروني غير مهيأ بعد، يمكنك إتمام الطلب عبر واتساب." });
      return;
    }
    const parsed = checkoutInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "السلة غير صالحة" });
      return;
    }
    try {
      const catalog = await listCatalogItems();
      const lines: HandoffPayload["items"] = [];
      for (const { id, quantity } of parsed.data.items) {
        const item = catalog.find(row => row.id === id);
        if (!item || !item.priceHalalas || item.priceHalalas <= 0) {
          res.status(409).json({ error: `«${item?.name ?? "عنصر"}» غير متاح للدفع الإلكتروني، اطلبه عبر واتساب.` });
          return;
        }
        const existing = lines.find(line => line.id === id);
        if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + quantity);
        else lines.push({ id, name: item.name, qty: quantity, price: item.priceHalalas });
      }
      const now = Date.now();
      const payload: HandoffPayload = {
        v: 1,
        ref: `WEB-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
        items: lines,
        total: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
        currency: "SAR",
        lang: "ar",
        storeUrl: STORE_URL,
        iat: now,
        exp: now + HANDOFF_MINUTES * 60_000,
      };
      res.json({ action: `${PAY_SITE_URL}/checkout`, fields: signHandoff(payload, secret) });
    } catch (error) {
      console.error("[PayHandoff] failed", error);
      res.status(500).json({ error: "تعذر تجهيز الطلب، حاول مرة أخرى." });
    }
  });
}
