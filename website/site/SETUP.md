# ayqaealhayaa.sa on your own server

This folder is a working copy of the Manus export (`../ayqae-alhayaa-store-transfer-2026-10-26`, left untouched),
changed so it runs on any Node.js + MySQL server and sends customers to **pay.ayqaealhayaa.sa** to pay.

## What changed from the export

| Area | Before (Manus) | Now |
|---|---|---|
| Images | Manus Forge storage | Files in `uploads/` on the server, same `/manus-storage/...` URLs |
| Admin login | Manus OAuth + email/password | Email/password only (`BILLING_ADMIN_EMAIL` / `BILLING_ADMIN_PASSWORD`) |
| Build tools | Manus runtime/debug plugins | Removed |
| Cart checkout | Opens WhatsApp | **"إتمام الطلب والدفع"** sends the cart to pay.ayqaealhayaa.sa (WhatsApp stays as a link under it) |
| Services | Names only | Services with a price (e.g. 50 and 100 SAR) get a price and **"أضف للسلة"** |
| Cart | No total | Shows the total; items "priced on request" can't be added (they link to contact) |

Files touched: `client/src/pages/Home.tsx`, `client/src/index.css`, `client/src/main.tsx`, `client/index.html`,
`server/storage.ts`, `server/_core/storageProxy.ts`, `server/_core/index.ts`, `server/storeAdminService.ts`, `vite.config.ts`.
New: `server/payHandoff.ts`, `scripts/seed-storefront.mjs`, `scripts/storefront-content.json`, `uploads/`, `.env.example`.

## How the cart reaches the pay site

1. The customer presses **إتمام الطلب والدفع**. The browser sends only item IDs and quantities to `POST /api/checkout/pay`.
2. The website's server takes prices **from the database**, builds the order (items, total, a `WEB-…` reference,
   30-minute expiry) and signs it with `PAY_HANDOFF_SECRET` (HMAC-SHA256).
3. The browser posts it to `https://pay.ayqaealhayaa.sa/checkout`. The pay site checks the signature, so a changed
   amount, an old link or a reused cart is refused.
4. The pay site asks for name and mobile (email optional), then sends the customer to PayOne. Nothing else is sent:
   PayOne itself needs only the amount, order number and the return address.
5. After paying, **العودة إلى المتجر** opens `https://ayqaealhayaa.sa/?paid=AYQ-…`, which empties the cart.

## Run it locally (Windows)

```
cd website/site
npx pnpm@10.4.1 install
copy .env.example .env      # then fill DATABASE_URL, secrets; PAY_SITE_URL=http://localhost:3000, STORE_URL=http://localhost:3100
npx drizzle-kit migrate
node --env-file=.env scripts/seed-storefront.mjs
npx tsx server/_core/index.ts      # http://localhost:3100  (admin: /admin)
```

The pay site runs from `payone-test` (`node payone-test/server.js`, port 3000).

## Put it on the server

1. **Server**: Node.js 22+, MySQL 8 or MariaDB, HTTPS. Two sites: `ayqaealhayaa.sa` (this folder) and
   `pay.ayqaealhayaa.sa` (the `payone-test` folder). Add a DNS **A record** for `pay` pointing to the server.
2. **Website**
   - Upload this folder (without `node_modules`), then `npx pnpm@10.4.1 install --frozen-lockfile`.
   - Create the database and set the variables from `.env.example` with real values (new secrets, new admin password).
   - `npx drizzle-kit migrate`, then `node --env-file=.env scripts/seed-storefront.mjs` (adds the 12 catalog items and page texts once).
   - Make sure `uploads/` is kept between deployments (it holds the images).
   - `npx pnpm@10.4.1 build`, then `NODE_ENV=production node dist/index.js` (keep it running with pm2 or the host's Node.js manager).
3. **Pay site** (`payone-test`)
   - In `config.json`: `publicUrl` = `https://pay.ayqaealhayaa.sa`, `storeUrl` = `https://ayqaealhayaa.sa`,
     `handoffSecret` = the same value as the website's `PAY_HANDOFF_SECRET`, and a new `adminPassword`.
   - Keep `info-client.txt` (PayOne merchant ID / token / URLs). For going live, replace them with the production values from PayOne.
   - `node server.js` (no install needed). Its `data/` folder holds the orders: back it up.
4. Point the domains at the new server only after testing both on the new host.

## Tests

`npx vitest run`: 25 pass. 3 need the old CCAvenue keys and the admin password in the test environment, which the export
left out on purpose (`ccavenueConfig.test.ts`, `billingAuth.test.ts`).
